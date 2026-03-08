import { describe, it, expect, vi, beforeEach } from 'vitest';

// set env before module load so JWT_SIGNING_KEY is available in CI
process.env.JWT_SIGNING_KEY ??= 'test-secret';
process.env.USER_TABLE ??= 'user_d';

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

vi.mock('$lib/server/mail', () => ({
	MailClient: vi.fn(function () {
		return {
			sendUserRegistrationEmail: vi.fn(),
			sendPasswordResetEmail: vi.fn(),
		};
	}),
}));

// auto-stub: returns a proxy that creates vi.fn() for any accessed property
function autoStub() {
	const stubs: Record<string, any> = {};
	return new Proxy(stubs, {
		get(target, prop) {
			if (typeof prop === 'string' && !(prop in target)) {
				target[prop] = vi.fn();
			}
			return target[prop];
		},
	});
}

vi.mock('$lib/server/db', () => ({
	DbProvider: vi.fn(function () { return autoStub(); }),
}));

vi.mock('$lib/server/repositories/user.repository', () => ({
	UserRepository: vi.fn(function () { return autoStub(); }),
}));

vi.mock('$lib/server/repositories/workspace.repository', () => ({
	WorkspaceRepository: vi.fn(function () { return autoStub(); }),
}));

vi.mock('$lib/server/repositories/settings.repository', () => ({
	SettingsRepository: vi.fn(function () { return autoStub(); }),
}));

vi.mock('$lib/server/repositories/oauth.repository', () => ({
	OAuthRepository: vi.fn(function () { return autoStub(); }),
}));

import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';

import {
	signToken,
	verifyToken,
	hashPassword,
	comparePassword,
	authenticate,
	login,
	verifyRegistrationToken,
	verifyPasswordResetToken,
	resetPasswordWithToken,
	resetPassword,
	forceResetPassword,
	userRepo,
} from '$lib/server/auth';

// --- token operations ---

describe('auth - token operations', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('signToken resolves with a token string', async () => {
		vi.mocked(jwt.sign).mockImplementation((_p, _s, _o, cb: any) => cb(null, 'signed-token'));

		const result = await signToken({ userId: 'u1' });
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

		await expect(signToken({ userId: 'u1' })).rejects.toThrow('sign error');
	});

	it('verifyToken resolves with decoded payload', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(null, { userId: 'u1' })
		);

		const result = await verifyToken<{ userId: string }>('some-token');
		expect(result).toEqual({ userId: 'u1' });
	});

	it('verifyToken rejects on invalid token', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('invalid'))
		);

		await expect(verifyToken('bad-token')).rejects.toThrow('invalid');
	});

	it('hashPassword delegates to bcrypt hash', async () => {
		vi.mocked(hash).mockResolvedValue('hashed-pw' as never);

		const result = await hashPassword('my-password');
		expect(result).toBe('hashed-pw');
		expect(hash).toHaveBeenCalledWith('my-password', 10);
	});

	it('comparePassword delegates to bcrypt compare', async () => {
		vi.mocked(compare).mockResolvedValue(true as never);

		const result = await comparePassword('plain', 'hashed');
		expect(result).toBe(true);
		expect(compare).toHaveBeenCalledWith('plain', 'hashed');
	});
});

// --- authenticate ---

describe('auth - authenticate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns null when no token provided', async () => {
		const result = await authenticate(undefined);
		expect(result).toBeNull();
	});

	it('returns user when token is valid', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(null, { userId: 'u1', username: 'testuser' })
		);

		const result = await authenticate('valid-token');
		expect(result).toEqual({ userId: 'u1', username: 'testuser' });
	});

	it('returns null when token verification fails', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('expired'))
		);

		const result = await authenticate('expired-token');
		expect(result).toBeNull();
	});
});

// --- login ---

describe('auth - login', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns error when user not found', async () => {
		vi.mocked(userRepo.findCredentials).mockResolvedValue(null as any);

		const result = await login('nobody', 'pass');
		expect(result.status).toBe('error');
	});

	it('returns error on wrong password', async () => {
		vi.mocked(userRepo.findCredentials).mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 1,
		});
		vi.mocked(compare).mockResolvedValue(false as never);

		const result = await login('user1', 'wrong-pass');
		expect(result.status).toBe('error');
	});

	it('returns verification error when user is unverified', async () => {
		vi.mocked(userRepo.findCredentials).mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 0,
		});
		vi.mocked(compare).mockResolvedValue(true as never);

		const result = await login('user1', 'correct');
		expect(result.status).toBe('error');
		expect(result).toHaveProperty('needsVerification', true);
		expect(result).toHaveProperty('email', 'test@test.com');
	});

	it('returns token on successful login', async () => {
		vi.mocked(userRepo.findCredentials).mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 1,
		});
		vi.mocked(compare).mockResolvedValue(true as never);
		vi.mocked(userRepo.findById).mockResolvedValue({
			status: 'success',
			data: { userId: 'u1', username: 'user1' } as any,
		});
		vi.mocked(userRepo.updateLastActivity).mockResolvedValue(undefined as any);
		vi.mocked(jwt.sign).mockImplementation((_p, _s, _o, cb: any) => cb(null, 'jwt-token'));

		const result = await login('user1', 'correct');
		expect(result.status).toBe('success');
		expect(result).toHaveProperty('data', 'jwt-token');
	});

	it('returns error when findById fails', async () => {
		vi.mocked(userRepo.findCredentials).mockResolvedValue({
			userId: 'u1',
			email: 'test@test.com',
			password: 'hashed',
			verified: 1,
		});
		vi.mocked(compare).mockResolvedValue(true as never);
		vi.mocked(userRepo.findById).mockResolvedValue({
			status: 'error',
			error: 'DB error',
		});

		const result = await login('user1', 'correct');
		expect(result.status).toBe('error');
	});
});

// --- token verification ---

describe('auth - verifyRegistrationToken', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns valid result for good token', async () => {
		const payload = { userId: 'u1', iat: 1000, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));

		const result = await verifyRegistrationToken('good-token');
		expect(result).toEqual({ valid: true, expired: false, payload });
	});

	it('returns expired result for expired token', async () => {
		const err = new (jwt as any).TokenExpiredError('expired');
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(err));
		vi.mocked(jwt.decode).mockReturnValue({ userId: 'u1' } as any);

		const result = await verifyRegistrationToken('expired-token');
		expect(result.valid).toBe(false);
		expect(result.expired).toBe(true);
		expect(result.payload).toEqual({ userId: 'u1' });
	});

	it('returns invalid result for malformed token', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('malformed'))
		);

		const result = await verifyRegistrationToken('bad');
		expect(result).toEqual({ valid: false, expired: false });
	});
});

describe('auth - verifyPasswordResetToken', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns valid when token has correct type', async () => {
		const payload = { userId: 'u1', email: 'a@b.com', type: 'password-reset', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));

		const result = await verifyPasswordResetToken('token');
		expect(result.valid).toBe(true);
		expect(result.payload).toEqual(payload);
	});

	it('returns invalid when token type is wrong', async () => {
		const payload = { userId: 'u1', type: 'registration', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));

		const result = await verifyPasswordResetToken('token');
		expect(result.valid).toBe(false);
	});
});

// --- password reset ---

describe('auth - resetPasswordWithToken', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('resets password with valid token', async () => {
		const payload = { userId: 'u1', email: 'a@b.com', type: 'password-reset', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		vi.mocked(userRepo.updatePassword).mockResolvedValue(1 as any);

		const result = await resetPasswordWithToken('token', 'new-pass');
		expect(result.status).toBe('success');
	});

	it('returns error for invalid token', async () => {
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) =>
			cb(new Error('invalid'))
		);

		const result = await resetPasswordWithToken('bad', 'new-pass');
		expect(result.status).toBe('error');
	});

	it('returns error when user not found', async () => {
		const payload = { userId: 'u1', email: 'a@b.com', type: 'password-reset', iat: 1, exp: 9999999999 };
		vi.mocked(jwt.verify).mockImplementation((_t, _s, cb: any) => cb(null, payload));
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		vi.mocked(userRepo.updatePassword).mockResolvedValue(0 as any);

		const result = await resetPasswordWithToken('token', 'new-pass');
		expect(result.status).toBe('error');
	});
});

describe('auth - resetPassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns false when user not found', async () => {
		vi.mocked(userRepo.findPasswordHash).mockResolvedValue(null as any);

		const result = await resetPassword('u1', 'old', 'new');
		expect(result).toBe(false);
	});

	it('returns false when old password is wrong', async () => {
		vi.mocked(userRepo.findPasswordHash).mockResolvedValue({ password: 'hashed-old' });
		vi.mocked(compare).mockResolvedValue(false as never);

		const result = await resetPassword('u1', 'wrong-old', 'new');
		expect(result).toBe(false);
	});

	it('returns true on successful reset', async () => {
		vi.mocked(userRepo.findPasswordHash).mockResolvedValue({ password: 'hashed-old' });
		vi.mocked(compare).mockResolvedValue(true as never);
		vi.mocked(hash).mockResolvedValue('hashed-new' as never);
		vi.mocked(userRepo.updatePassword).mockResolvedValue(1 as any);

		const result = await resetPassword('u1', 'old', 'new');
		expect(result).toBe(true);
	});
});

describe('auth - forceResetPassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns true on success', async () => {
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		vi.mocked(userRepo.updatePassword).mockResolvedValue(1 as any);

		const result = await forceResetPassword('u1', 'new-pass');
		expect(result).toBe(true);
	});

	it('returns false when user not found', async () => {
		vi.mocked(hash).mockResolvedValue('new-hash' as never);
		vi.mocked(userRepo.updatePassword).mockResolvedValue(0 as any);

		const result = await forceResetPassword('u1', 'new-pass');
		expect(result).toBe(false);
	});

	it('returns false on error', async () => {
		vi.mocked(hash).mockRejectedValue(new Error('bcrypt error'));

		const result = await forceResetPassword('u1', 'new-pass');
		expect(result).toBe(false);
	});
});
