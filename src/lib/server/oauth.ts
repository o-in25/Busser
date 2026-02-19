import { dev } from '$app/environment';

import type { User } from '$lib/types';

import { authRepo, settingsRepo, userRepo, workspaceRepo } from './auth';
import { Logger } from './logger';
import { OAuthRepository } from './repositories/oauth.repository';
import { DbProvider } from './db';

const { USER_TABLE } = process.env;
const db = new DbProvider(USER_TABLE || '');
export const oauthRepo = new OAuthRepository(db);

export interface OAuthProfile {
	providerUserId: string;
	email: string;
	name: string;
}

export async function handleOAuthCallback(
	provider: string,
	profile: OAuthProfile
): Promise<{ token: string } | { error: string }> {
	try {
		// 1. check if oauth identity already exists
		const existing = await oauthRepo.findByProviderUserId(provider, profile.providerUserId);
		if (existing) {
			await oauthRepo.updateLastLogin(existing.oauthIdentityId);
			await db.table('user').update({ lastActivityDate: Logger.now() }).where({ userId: existing.userId });

			const userResult = await userRepo.findById(existing.userId);
			if (userResult.status !== 'success' || !userResult.data) {
				return { error: 'Failed to load user account.' };
			}

			const token = await authRepo.signToken<User>(userResult.data);
			return { token };
		}

		// 2. check if a user exists with matching email
		const existingUser = await db
			.table('user')
			.where({ email: profile.email.toLowerCase() })
			.select('userId', 'verified')
			.first();

		if (existingUser) {
			// auto-link and auto-verify
			await oauthRepo.create(existingUser.userId, provider, profile.providerUserId, profile.email);

			if (existingUser.verified !== 1) {
				await db.table('user').where({ userId: existingUser.userId }).update({ verified: 1 });
			}

			await db.table('user').update({ lastActivityDate: Logger.now() }).where({ userId: existingUser.userId });

			const userResult = await userRepo.findById(existingUser.userId);
			if (userResult.status !== 'success' || !userResult.data) {
				return { error: 'Failed to load user account.' };
			}

			const token = await authRepo.signToken<User>(userResult.data);
			return { token };
		}

		// 3. new user registration
		const inviteOnly = await settingsRepo.isInviteOnly();
		if (inviteOnly) {
			// check for an unused invitation matching this email
			const invitation = await db
				.table('invitation')
				.where({ email: profile.email.toLowerCase() })
				.whereNull('userId')
				.first();

			if (!invitation) {
				return { error: 'An invitation is required to sign up.' };
			}
		}

		// generate unique username
		const baseUsername = generateUsername(profile.name);
		const username = await findUniqueUsername(baseUsername);

		// create user, roles, workspaces, and oauth identity in a transaction
		const userId = await db.query.transaction(async (trx) => {
			await trx('user').insert({
				username,
				email: profile.email.toLowerCase(),
				password: null,
				verified: 1,
				createdDate: Logger.now(),
			});

			const userRecord = await trx('user')
				.select('userId')
				.where({ username, email: profile.email.toLowerCase() })
				.first();

			if (!userRecord?.userId) throw new Error('Could not create user.');
			const newUserId = userRecord.userId;

			// assign USER role
			const role = await trx('role').select('roleId').where('roleName', 'USER').first();
			if (!role?.roleId) throw new Error('Could not assign default role.');
			await trx('userRole').insert({ userId: newUserId, roleId: role.roleId });

			// create personal workspace
			const slug = username
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '')
				.substring(0, 40);
			const suffix = Math.random().toString(36).substring(2, 10);
			const workspaceId = `${slug}-${suffix}`;

			await trx('workspace').insert({
				workspaceId,
				workspaceName: `${username}'s Workspace`,
				workspaceType: 'personal',
				createdDate: Logger.now(),
				createdBy: newUserId,
			});

			await trx('workspaceUser').insert({
				workspaceId,
				userId: newUserId,
				workspaceRole: 'owner',
				joinedDate: Logger.now(),
			});

			// add to global catalog as viewer
			await trx('workspaceUser').insert({
				workspaceId: 'ws-global-catalog',
				userId: newUserId,
				workspaceRole: 'viewer',
				joinedDate: Logger.now(),
			});

			// mark invitation as used if invite-only
			if (inviteOnly) {
				await trx('invitation')
					.where({ email: profile.email.toLowerCase() })
					.whereNull('userId')
					.update({ userId: newUserId });
			}

			// create oauth identity
			await trx('oauthIdentity').insert({
				userId: newUserId,
				provider,
				providerUserId: profile.providerUserId,
				email: profile.email,
				createdDate: Logger.now(),
				lastLoginDate: Logger.now(),
			});

			return newUserId;
		});

		// generate avatar (async, non-blocking)
		userRepo.generateAndUploadAvatar(userId).catch((err: any) => {
			console.error('Failed to generate avatar for OAuth user:', err);
		});

		const userResult = await userRepo.findById(userId);
		if (userResult.status !== 'success' || !userResult.data) {
			return { error: 'Account created but failed to load. Please try logging in.' };
		}

		const token = await authRepo.signToken<User>(userResult.data);
		return { token };
	} catch (error: any) {
		console.error('OAuth callback error:', error);
		return { error: 'An error occurred during sign-in. Please try again.' };
	}
}

// resolve which page to redirect to after login
export async function resolvePostLoginRedirect(
	userId: string,
	cookies: {
		set: (name: string, value: string, opts: any) => void;
		get: (name: string) => string | undefined;
	}
): Promise<string> {
	const preferredWorkspaceId = await userRepo.getPreferredWorkspaceId(userId);
	if (preferredWorkspaceId) {
		const role = await workspaceRepo.hasWorkspaceAccess(userId, preferredWorkspaceId);
		if (role) {
			cookies.set('activeWorkspaceId', preferredWorkspaceId, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !dev,
				maxAge: 60 * 60 * 24 * 365,
			});
			return '/';
		}
	}

	const workspacesResult = await workspaceRepo.getUserWorkspaces(userId);
	if (workspacesResult.status === 'success' && workspacesResult.data) {
		if (workspacesResult.data.length === 1) {
			cookies.set('activeWorkspaceId', workspacesResult.data[0].workspaceId, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !dev,
				maxAge: 60 * 60 * 24 * 365,
			});
			return '/';
		} else if (workspacesResult.data.length > 1) {
			return '/workspace-selector';
		}
	}

	return '/';
}

function generateUsername(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.substring(0, 20) || 'user';
}

async function findUniqueUsername(base: string): Promise<string> {
	let candidate = base;
	let suffix = 1;

	while (true) {
		const existing = await db.table('user').where({ username: candidate }).first();
		if (!existing) return candidate;
		candidate = `${base}${suffix}`;
		suffix++;
	}
}
