import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/logger', () => ({
	Logger: { now: () => '2026-01-01 00:00:00', error: vi.fn(), info: vi.fn() },
}));

vi.mock('$lib/server/repositories/user.repository', () => ({
	UserRepository: vi.fn(),
}));

import { OAuthRepository } from '$lib/server/repositories/oauth.repository';

// helper: chainable knex mock
function mockTable() {
	const chain: any = {};
	const methods = ['where', 'whereNot', 'select', 'first', 'update', 'insert', 'del', 'distinct', 'whereIn'];
	for (const m of methods) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	return chain;
}

function makeDb() {
	const chain = mockTable();
	const trxChain = mockTable();
	const db = {
		table: vi.fn().mockReturnValue(chain),
		query: {
			transaction: vi.fn(async (fn: any) => fn(makeTrx(trxChain))),
		},
	} as any;
	return { db, chain, trxChain };
}

function makeTrx(chain: any) {
	const trx = vi.fn().mockReturnValue(chain);
	return trx;
}

function makeUserRepo(overrides: Record<string, any> = {}) {
	return {
		findById: vi.fn().mockResolvedValue({ status: 'success', data: { userId: 'u1', username: 'testuser' } }),
		findByEmail: vi.fn(),
		register: vi.fn(),
		...overrides,
	} as any;
}

// --- findByOAuthAccount ---

describe('OAuthRepository - findByOAuthAccount', () => {
	let repo: OAuthRepository;
	let chain: any;
	let userRepo: any;

	beforeEach(() => {
		const made = makeDb();
		chain = made.chain;
		userRepo = makeUserRepo();
		repo = new OAuthRepository(made.db, userRepo);
		vi.clearAllMocks();
	});

	it('returns user when oauth link exists', async () => {
		chain.first.mockResolvedValue({ userId: 'u1' });
		userRepo.findById.mockResolvedValue({ status: 'success', data: { userId: 'u1' } });

		const result = await repo.findByOAuthAccount('google', 'goog-123');

		expect(result.status).toBe('success');
		expect(userRepo.findById).toHaveBeenCalledWith('u1');
	});

	it('returns error when no link found', async () => {
		chain.first.mockResolvedValue(null);

		const result = await repo.findByOAuthAccount('google', 'unknown');

		expect(result.status).toBe('error');
		expect(userRepo.findById).not.toHaveBeenCalled();
	});

	it('returns error on db failure', async () => {
		chain.first.mockRejectedValue(new Error('db down'));

		const result = await repo.findByOAuthAccount('google', 'goog-123');

		expect(result.status).toBe('error');
	});
});

// --- linkOAuthAccount ---

describe('OAuthRepository - linkOAuthAccount', () => {
	let repo: OAuthRepository;
	let chain: any;

	beforeEach(() => {
		const made = makeDb();
		chain = made.chain;
		repo = new OAuthRepository(made.db, makeUserRepo());
		vi.clearAllMocks();
	});

	it('inserts oauth link and returns success', async () => {
		chain.insert.mockResolvedValue([1]);

		const result = await repo.linkOAuthAccount('u1', 'google', 'goog-123');

		expect(result.status).toBe('success');
	});

	it('returns error on duplicate entry', async () => {
		const dupError: any = new Error('Duplicate entry');
		dupError.code = 'ER_DUP_ENTRY';
		chain.insert.mockRejectedValue(dupError);

		const result = await repo.linkOAuthAccount('u1', 'google', 'goog-123');

		expect(result.status).toBe('error');
		expect(result).toHaveProperty('error', 'This OAuth account is already linked.');
	});
});

// --- getLinkedAccounts ---

describe('OAuthRepository - getLinkedAccounts', () => {
	let repo: OAuthRepository;
	let chain: any;

	beforeEach(() => {
		const made = makeDb();
		chain = made.chain;
		repo = new OAuthRepository(made.db, makeUserRepo());
		vi.clearAllMocks();
	});

	it('returns linked accounts for user', async () => {
		const accounts = [{ provider: 'google', createdAt: '2026-01-01' }];
		// select returns the chain, but we need where to resolve
		chain.where.mockResolvedValue(accounts);

		const result = await repo.getLinkedAccounts('u1');

		expect(result.status).toBe('success');
		if (result.status === 'success') {
			expect(result.data).toEqual(accounts);
		}
	});
});

// --- hasPassword ---

describe('OAuthRepository - hasPassword', () => {
	let repo: OAuthRepository;
	let chain: any;

	beforeEach(() => {
		const made = makeDb();
		chain = made.chain;
		repo = new OAuthRepository(made.db, makeUserRepo());
		vi.clearAllMocks();
	});

	it('returns true when user has a password', async () => {
		chain.first.mockResolvedValue({ password: 'hashed' });

		const result = await repo.hasPassword('u1');
		expect(result).toBe(true);
	});

	it('returns false when user has no password', async () => {
		chain.first.mockResolvedValue({ password: null });

		const result = await repo.hasPassword('u1');
		expect(result).toBe(false);
	});

	it('returns false on error', async () => {
		chain.first.mockRejectedValue(new Error('fail'));

		const result = await repo.hasPassword('u1');
		expect(result).toBe(false);
	});
});

// --- unlinkOAuthAccount ---

describe('OAuthRepository - unlinkOAuthAccount', () => {
	let repo: OAuthRepository;
	let db: any;

	beforeEach(() => {
		const made = makeDb();
		db = made.db;
		repo = new OAuthRepository(made.db, makeUserRepo());
		vi.clearAllMocks();
	});

	it('unlinks when user has a password', async () => {
		// three table() calls: user select, oauthUser where, oauthUser where+del
		const userChain = mockTable();
		const oauthListChain = mockTable();
		const oauthDelChain = mockTable();

		userChain.first.mockResolvedValue({ password: 'hashed' });
		oauthListChain.where.mockResolvedValue([{ provider: 'google' }]);
		oauthDelChain.del.mockResolvedValue(1);

		db.table
			.mockReturnValueOnce(userChain)
			.mockReturnValueOnce(oauthListChain)
			.mockReturnValueOnce(oauthDelChain);

		const result = await repo.unlinkOAuthAccount('u1', 'google');
		expect(result.status).toBe('success');
	});

	it('blocks unlink when only login method', async () => {
		const userChain = mockTable();
		const oauthListChain = mockTable();

		userChain.first.mockResolvedValue({ password: null });
		oauthListChain.where.mockResolvedValue([{ provider: 'google' }]);

		db.table
			.mockReturnValueOnce(userChain)
			.mockReturnValueOnce(oauthListChain);

		const result = await repo.unlinkOAuthAccount('u1', 'google');
		expect(result.status).toBe('error');
		expect(result).toHaveProperty('error', 'Cannot unlink your only login method. Set a password first.');
	});

	it('returns error when linked account not found', async () => {
		const userChain = mockTable();
		const oauthListChain = mockTable();
		const oauthDelChain = mockTable();

		userChain.first.mockResolvedValue({ password: 'hashed' });
		oauthListChain.where.mockResolvedValue([{ provider: 'google' }, { provider: 'apple' }]);
		oauthDelChain.del.mockResolvedValue(0);

		db.table
			.mockReturnValueOnce(userChain)
			.mockReturnValueOnce(oauthListChain)
			.mockReturnValueOnce(oauthDelChain);

		const result = await repo.unlinkOAuthAccount('u1', 'apple');
		expect(result.status).toBe('error');
		expect(result).toHaveProperty('error', 'Linked account not found.');
	});
});

// --- registerOAuth ---

describe('OAuthRepository - registerOAuth', () => {
	let repo: OAuthRepository;
	let trxChain: any;
	let userRepo: any;

	const profile = {
		provider: 'google' as const,
		providerUserId: 'goog-123',
		email: 'test@test.com',
		name: 'Test User',
		avatarUrl: 'https://example.com/avatar.jpg',
	};

	beforeEach(() => {
		const made = makeDb();
		trxChain = made.trxChain;
		userRepo = makeUserRepo({
			register: vi.fn().mockResolvedValue({ userId: 'u1', username: 'user-abc', email: 'test@test.com' }),
			findById: vi.fn().mockResolvedValue({ status: 'success', data: { userId: 'u1', username: 'user-abc' } }),
		});
		repo = new OAuthRepository(made.db, userRepo);
		vi.clearAllMocks();
		// re-apply after clearAllMocks
		userRepo.register.mockResolvedValue({ userId: 'u1', username: 'user-abc', email: 'test@test.com' });
		userRepo.findById.mockResolvedValue({ status: 'success', data: { userId: 'u1', username: 'user-abc' } });
	});

	it('registers new user without invitation', async () => {
		trxChain.insert.mockResolvedValue([1]);

		const result = await repo.registerOAuth(profile, null);

		expect(result.status).toBe('success');
		expect(userRepo.register).toHaveBeenCalled();
		expect(userRepo.findById).toHaveBeenCalledWith('u1');
	});

	it('registers with valid invitation code', async () => {
		trxChain.first.mockResolvedValue({
			invitationId: 1,
			userId: null,
			email: 'test@test.com',
			expiresAt: null,
			workspaceId: 'ws-1',
			workspaceRole: 'editor',
		});
		trxChain.insert.mockResolvedValue([1]);
		trxChain.update.mockResolvedValue(1);

		const result = await repo.registerOAuth(profile, 'INVITE-CODE');

		expect(result.status).toBe('success');
	});

	it('returns error for already-used invitation', async () => {
		trxChain.first.mockResolvedValue({
			invitationId: 1,
			userId: 'someone-else',
			email: null,
			expiresAt: null,
		});
		trxChain.insert.mockResolvedValue([1]);

		const result = await repo.registerOAuth(profile, 'USED-CODE');

		expect(result.status).toBe('error');
	});

	it('returns error for email mismatch on invitation', async () => {
		trxChain.first.mockResolvedValue({
			invitationId: 1,
			userId: null,
			email: 'different@test.com',
			expiresAt: null,
		});
		trxChain.insert.mockResolvedValue([1]);

		const result = await repo.registerOAuth(profile, 'CODE');

		expect(result.status).toBe('error');
	});

	it('returns friendly error on registration failure', async () => {
		userRepo.register.mockRejectedValue(new Error('Some unexpected DB error'));

		const result = await repo.registerOAuth(profile, null);

		expect(result.status).toBe('error');
		if (result.status === 'error') {
			expect(result.error).toBe('An error occurred during registration.');
		}
	});

	it('returns specific error for known messages', async () => {
		userRepo.register.mockRejectedValue(new Error('Email already taken.'));

		const result = await repo.registerOAuth(profile, null);

		expect(result.status).toBe('error');
		if (result.status === 'error') {
			expect(result.error).toBe('Email already taken.');
		}
	});
});

// --- completeOnboarding ---

describe('OAuthRepository - completeOnboarding', () => {
	let repo: OAuthRepository;
	let trxChain: any;

	beforeEach(() => {
		const made = makeDb();
		trxChain = made.trxChain;
		repo = new OAuthRepository(made.db, makeUserRepo());
		vi.clearAllMocks();
	});

	it('completes onboarding successfully', async () => {
		// username uniqueness check
		trxChain.first.mockResolvedValueOnce(null);
		// update user
		trxChain.update.mockResolvedValueOnce(1);
		// find personal workspace
		trxChain.first.mockResolvedValueOnce({ workspaceId: 'ws-personal' });
		// update workspace name
		trxChain.update.mockResolvedValueOnce(1);

		const result = await repo.completeOnboarding('u1', 'newusername');
		expect(result.status).toBe('success');
	});

	it('returns error when username is taken by another user', async () => {
		trxChain.first.mockResolvedValueOnce({ userId: 'other-user' });

		const result = await repo.completeOnboarding('u1', 'taken-name');

		expect(result.status).toBe('error');
		if (result.status === 'error') {
			expect(result.error).toBe('Username already taken.');
		}
	});

	it('allows same user to keep their username', async () => {
		trxChain.first.mockResolvedValueOnce({ userId: 'u1' });
		trxChain.update.mockResolvedValueOnce(1);
		trxChain.first.mockResolvedValueOnce(null);

		const result = await repo.completeOnboarding('u1', 'existing-name');
		expect(result.status).toBe('success');
	});
});
