// oauth data access
import moment from 'moment';

import type { Invitation, OAuthProfile, QueryResult, User } from '$lib/types';
import type { LinkedOAuthAccount } from '$lib/types/oauth';

import { DbProvider } from '../db';
import { Logger } from '../logger';
import { BaseRepository } from './base.repository';
import { UserRepository } from './user.repository';

export class OAuthRepository extends BaseRepository {
	private userRepo: UserRepository;

	constructor(db: DbProvider, userRepo: UserRepository) {
		super(db);
		this.userRepo = userRepo;
	}

	async findByOAuthAccount(provider: string, providerUserId: string): Promise<QueryResult<User>> {
		try {
			const link = await this.db.table('oauthUser').where({ provider, providerUserId }).first();

			if (!link) {
				return { status: 'error', error: 'OAuth account not found.' };
			}

			return this.userRepo.findById(link.userId);
		} catch (error: any) {
			console.error('Failed to find OAuth account:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	async linkOAuthAccount(
		userId: string,
		provider: string,
		providerUserId: string
	): Promise<QueryResult> {
		try {
			await this.db.table('oauthUser').insert({
				provider,
				providerUserId,
				userId,
				createdAt: Logger.now(),
			});

			return { status: 'success' };
		} catch (error: any) {
			if (error.code === 'ER_DUP_ENTRY') {
				return { status: 'error', error: 'This OAuth account is already linked.' };
			}
			console.error('Failed to link OAuth account:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	// registers user + creates oauth link + consumes invitation in one transaction
	async registerOAuth(
		profile: OAuthProfile,
		invitationCode: string | null = null
	): Promise<QueryResult<User>> {
		try {
			const user = await this.db.query.transaction(async (trx) => {
				const suffix = Math.random().toString(36).substring(2, 10);
				const username = `user-${suffix}`;

				const user = await this.userRepo.register(trx, {
					username,
					email: profile.email,
					password: null,
					verified: 1,
					needsOnboarding: 1,
					avatarUrl: profile.avatarUrl,
				});

				await trx('oauthUser').insert({
					provider: profile.provider,
					providerUserId: profile.providerUserId,
					userId: user.userId,
					createdAt: Logger.now(),
				});

				if (invitationCode) {
					const dbResult = await trx('invitation')
						.select('invitationId', 'userId', 'email', 'expiresAt', 'workspaceId', 'workspaceRole')
						.where({ invitationCode })
						.first();

					if (!dbResult) throw new Error('Invalid invitation code.');

					const invitation = dbResult as Pick<
						Invitation,
						'invitationId' | 'userId' | 'email' | 'expiresAt' | 'workspaceId' | 'workspaceRole'
					>;

					if (invitation.userId !== null) {
						throw new Error('Invitation code has already been used.');
					}

					if (invitation.expiresAt && moment().isAfter(moment(invitation.expiresAt))) {
						throw new Error('Invitation code has expired.');
					}

					if (invitation.email && invitation.email.toLowerCase() !== profile.email.toLowerCase()) {
						throw new Error('Email does not match the invitation.');
					}

					await trx('invitation')
						.where({ invitationId: invitation.invitationId })
						.update({ userId: user.userId });

					if (invitation.workspaceId && invitation.workspaceRole) {
						await trx('workspaceUser').insert({
							workspaceId: invitation.workspaceId,
							userId: user.userId,
							workspaceRole: invitation.workspaceRole,
							joinedDate: Logger.now(),
						});
					}
				}

				return user;
			});

			return this.userRepo.findById(user.userId);
		} catch (error: any) {
			console.error('Failed to register OAuth user:', error.message);

			const friendlyMessages = [
				'Email already taken.',
				'Could not create user.',
				'Invalid invitation code.',
				'Invitation code has already been used.',
				'Invitation code has expired.',
				'Email does not match the invitation.',
			];

			return {
				status: 'error',
				error: friendlyMessages.includes(error.message)
					? error.message
					: 'An error occurred during registration.',
			};
		}
	}

	async hasPassword(userId: string): Promise<boolean> {
		try {
			const user = await this.db.table('user').select('password').where({ userId }).first();
			return !!user?.password;
		} catch (error: any) {
			console.error('Failed to check password:', error.message);
			return false;
		}
	}

	async getLinkedAccounts(userId: string): Promise<QueryResult<LinkedOAuthAccount[]>> {
		try {
			const rows = await this.db
				.table('oauthUser')
				.select('provider', 'createdAt')
				.where({ userId });

			return { status: 'success', data: rows as LinkedOAuthAccount[] };
		} catch (error: any) {
			console.error('Failed to get linked accounts:', error.message);
			return { status: 'error', error: error.message };
		}
	}

	async unlinkOAuthAccount(userId: string, provider: string): Promise<QueryResult> {
		try {
			const user = await this.db.table('user').select('password').where({ userId }).first();
			const linkedAccounts = await this.db.table('oauthUser').where({ userId });

			if (!user?.password && linkedAccounts.length <= 1) {
				return {
					status: 'error',
					error: 'Cannot unlink your only login method. Set a password first.',
				};
			}

			const deleted = await this.db.table('oauthUser').where({ userId, provider }).del();

			if (!deleted) {
				return { status: 'error', error: 'Linked account not found.' };
			}

			return { status: 'success' };
		} catch (error: any) {
			console.error('Failed to unlink OAuth account:', error.message);
			return { status: 'error', error: error.message };
		}
	}
}
