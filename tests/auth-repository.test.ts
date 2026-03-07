import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock dependencies before imports
vi.mock('bcrypt', () => ({
	hash: vi.fn(),
	compare: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
	default: {
		verify: vi.fn(),
		sign: vi.fn(),
		decode: vi.fn(),
		TokenExpiredError: class TokenExpiredError extends Error {
			name = 'TokenExpiredError';
		},
	},
}));

vi.mock('$lib/server/logger', () => ({
	Logger: { now: () => '2026-01-01 00:00:00', error: vi.fn(), info: vi.fn() },
}));

import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '$lib/server/repositories/auth.repository';

// chainable knex mock
function mockTable() {
	const chain: any = {};
	const methods = ['where', 'select', 'first', 'update', 'insert', 'del'];
	for (const m of methods) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	return chain;
}

function makeDb() {
	const chain = mockTable();
	return {
		db: { table: vi.fn().mockReturnValue(chain) } as any,
		chain,
	};
}

// --- token operations ---

describe('AuthRepository - token operations', () => {
	let repo: AuthRepository;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const { db } = makeDb();
		repo = new AuthRepository(db);
		vi.clearAllMocks();
	});

	it('signToken resolves with a token string', async () => {
		vi.mocked(jwt.sign).mockImplementation((_p, _s, _o, cb: any) => cb(null, 'signed-token'));

		const result = await repo.signToken({ userId: 'u1' });
		expect(result).toBe('signed-token');
		expect(jwt.sign).toHaveBeenCalledWith(
			{ userId: 'u1' },
			expect.any(String),
			{ algorithm: 'HS256' },
			expect.any(Function)
		);
	});

	it('signToken rejects when jwt.sign fails', async () => {
		vi.mocked(jwt.sign).mockImplementation((_p, _s, _o, cb: any) => cb(new Error('sign error')));

		await expect(repo.signToken({ userId: 'u1' })).rejects.toThrow('sign error');
	});

	it('signToken rejects when no signing key', async () => {
		vi.stubEnv('JWT_SIGNING_KEY', '');
		const { db } = makeDb();
		const repoNoKey = new AuthRepository(db);

		await expect(repoNoKey.signToken({ userId: 'u1' })).rejects.toThrow();
	});

	it('verifyToken resolves with decoded payload', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(null, { userId: 'u1' })
		);

		const result = await repo.verifyToken<{ userId: string }>('some-token');
		expect(result).toEqual({ userId: 'u1' });
	});

	it('verifyToken rejects on invalid token', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('invalid'))
		);

		await expect(repo.verifyToken('bad-token')).rejects.toThrow('invalid');
	});

	it('hashPassword delegates to bcrypt hash', async () => {
		vi.mocked(hash).mockResolvedValue('hashed-pw' as never);

		const result = await repo.hashPassword('my-password');
		expect(result).toBe('hashed-pw');
		expect(hash).toHaveBeenCalledWith('my-password', 10);
	});

	it('comparePassword delegates to bcrypt compare', async () => {
		vi.mocked(compare).mockResolvedValue(true as never);

		const result = await repo.comparePassword('plain', 'hashed');
		expect(result).toBe(true);
		expect(compare).toHaveBeenCalledWith('plain', 'hashed');
	});
});

// --- authenticate ---

describe('AuthRepository - authenticate', () => {
	let repo: AuthRepository;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const { db } = makeDb();
		repo = new AuthRepository(db);
		vi.clearAllMocks();
	});

	it('returns null when no token provided', async () => {
		const result = await repo.authenticate(undefined);
		expect(result).toBeNull();
	});

	it('returns user when token is valid', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(null, { userId: 'u1', username: 'testuser' })
		);

		const result = await repo.authenticate('valid-token');
		expect(result).toEqual({ userId: 'u1', username: 'testuser' });
	});

	it('returns null when token verification fails', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('expired'))
		);

		const result = await repo.authenticate('expired-token');
		expect(result).toBeNull();
	});
});

// --- login ---

describe('AuthRepository - login', () => {
	let repo: AuthRepository;
	let chain: any;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const made = makeDb();
		chain = made.chain;
		repo = new AuthRepository(made.db);
		vi.clearAllMocks();
	});

	it('returns error when user not found', async () => {
		chain.first.mockResolvedValue(null);
		const getUserFn = vi.fn();

		const result = await repo.login('nobody', 'pass', getUserFn);

		expect(result.status).toBe('error');
		expect(getUserFn).not.toHaveBeenCalled();
	});

	it('returns error on wrong password', async () => {
		chain.first.mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 1,
		});
		vi.mocked(compare).mockResolvedValue(false as never);
		const getUserFn = vi.fn();

		const result = await repo.login('user1', 'wrong-pass', getUserFn);

		expect(result.status).toBe('error');
		expect(getUserFn).not.toHaveBeenCalled();
	});

	it('returns verification error when user is unverified', async () => {
		chain.first.mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 0,
		});
		vi.mocked(compare).mockResolvedValue(true as never);
		const getUserFn = vi.fn();

		const result = await repo.login('user1', 'correct', getUserFn);

		expect(result.status).toBe('error');
		expect(result).toHaveProperty('needsVerification', true);
		expect(result).toHaveProperty('email', 'test@test.com');
		expect(getUserFn).not.toHaveBeenCalled();
	});

	it('returns token on successful login', async () => {
		chain.first.mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 1,
		});
		vi.mocked(compare).mockResolvedValue(true as never);
		vi.mocked(jwt.sign).mockImplementation((_p, _s, _o, cb: any) => cb(null, 'jwt-token'));

		const getUserFn = vi.fn().mockResolvedValue({
			status: 'success',
			data: { userId: 'u1', username: 'user1' },
		});

		const result = await repo.login('user1', 'correct', getUserFn);

		expect(result.status).toBe('success');
		expect(result).toHaveProperty('data', 'jwt-token');
	});

	it('returns error when getUserFn fails', async () => {
		chain.first.mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 1,
		});
		vi.mocked(compare).mockResolvedValue(true as never);

		const getUserFn = vi.fn().mockResolvedValue({
			status: 'error',
			error: 'DB error',
		});

		const result = await repo.login('user1', 'correct', getUserFn);

		expect(result.status).toBe('error');
	});
});

// --- token verification ---

describe('AuthRepository - verifyRegistrationToken', () => {
	let repo: AuthRepository;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const { db } = makeDb();
		repo = new AuthRepository(db);
		vi.clearAllMocks();
	});

	it('returns valid result for good token', async () => {
		const payload = { userId: 'u1', iat: 1000, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));

		const result = await repo.verifyRegistrationToken('good-token');
		expect(result).toEqual({ valid: true, expired: false, payload });
	});

	it('returns expired result for expired token', async () => {
		const err = new (jwt as any).TokenExpiredError('expired');
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(err));
		vi.mocked(jwt.decode).mockReturnValue({ userId: 'u1' } as any);

		const result = await repo.verifyRegistrationToken('expired-token');
		expect(result.valid).toBe(false);
		expect(result.expired).toBe(true);
		expect(result.payload).toEqual({ userId: 'u1' });
	});

	it('returns invalid result for malformed token', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('malformed'))
		);

		const result = await repo.verifyRegistrationToken('bad');
		expect(result).toEqual({ valid: false, expired: false });
	});
});

describe('AuthRepository - verifyPasswordResetToken', () => {
	let repo: AuthRepository;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const { db } = makeDb();
		repo = new AuthRepository(db);
		vi.clearAllMocks();
	});

	it('returns valid when token has correct type', async () => {
		const payload = { userId: 'u1', email: 'a@b.com', type: 'password-reset', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));

		const result = await repo.verifyPasswordResetToken('token');
		expect(result.valid).toBe(true);
		expect(result.payload).toEqual(payload);
	});

	it('returns invalid when token type is wrong', async () => {
		const payload = { userId: 'u1', type: 'registration', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));

		const result = await repo.verifyPasswordResetToken('token');
		expect(result.valid).toBe(false);
	});
});

// --- password reset ---

describe('AuthRepository - resetPasswordWithToken', () => {
	let repo: AuthRepository;
	let chain: any;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const made = makeDb();
		chain = made.chain;
		repo = new AuthRepository(made.db);
		vi.clearAllMocks();
	});

	it('resets password with valid token', async () => {
		const payload = { userId: 'u1', email: 'a@b.com', type: 'password-reset', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		chain.update.mockResolvedValue(1);

		const result = await repo.resetPasswordWithToken('token', 'new-pass');
		expect(result.status).toBe('success');
	});

	it('returns error for invalid token', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('invalid'))
		);

		const result = await repo.resetPasswordWithToken('bad', 'new-pass');
		expect(result.status).toBe('error');
	});

	it('returns error when user not found', async () => {
		const payload = { userId: 'u1', email: 'a@b.com', type: 'password-reset', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		chain.update.mockResolvedValue(0);

		const result = await repo.resetPasswordWithToken('token', 'new-pass');
		expect(result.status).toBe('error');
	});
});

describe('AuthRepository - resetPassword', () => {
	let repo: AuthRepository;
	let chain: any;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const made = makeDb();
		chain = made.chain;
		repo = new AuthRepository(made.db);
		vi.clearAllMocks();
	});

	it('returns false when user not found', async () => {
		chain.first.mockResolvedValue(null);

		const result = await repo.resetPassword('u1', 'old', 'new');
		expect(result).toBe(false);
	});

	it('returns false when old password is wrong', async () => {
		chain.first.mockResolvedValue({ password: 'hashed-old' });
		vi.mocked(compare).mockResolvedValue(false as never);

		const result = await repo.resetPassword('u1', 'wrong-old', 'new');
		expect(result).toBe(false);
	});

	it('returns true on successful reset', async () => {
		chain.first.mockResolvedValue({ password: 'hashed-old' });
		vi.mocked(compare).mockResolvedValue(true as never);
		vi.mocked(hash).mockResolvedValue('hashed-new' as never);
		chain.update.mockResolvedValue(1);

		const result = await repo.resetPassword('u1', 'old', 'new');
		expect(result).toBe(true);
	});
});

describe('AuthRepository - forceResetPassword', () => {
	let repo: AuthRepository;
	let chain: any;

	beforeEach(() => {
		vi.stubEnv('JWT_SIGNING_KEY', 'test-secret');
		const made = makeDb();
		chain = made.chain;
		repo = new AuthRepository(made.db);
		vi.clearAllMocks();
	});

	it('returns true on success', async () => {
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		chain.update.mockResolvedValue(1);

		const result = await repo.forceResetPassword('u1', 'new-pass');
		expect(result).toBe(true);
	});

	it('returns false when user not found', async () => {
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		chain.update.mockResolvedValue(0);

		const result = await repo.forceResetPassword('u1', 'new-pass');
		expect(result).toBe(false);
	});

	it('returns false on error', async () => {
		vi.mocked(hash).mockRejectedValue(new Error('bcrypt error'));

		const result = await repo.forceResetPassword('u1', 'new-pass');
		expect(result).toBe(false);
	});
});
