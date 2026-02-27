// oauth account management repository
import moment from 'moment';

import type { Invitation, OAuthProfile, QueryResult, User } from '$lib/types';

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

	// find an existing oauth link by provider + provider user id
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

	// link an oauth provider to an existing user
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

	// register a new user from an oauth profile, optionally consuming an invite code
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
				});

				// create oauth link
				await trx('oauthUser').insert({
					provider: profile.provider,
					providerUserId: profile.providerUserId,
					userId: user.userId,
					createdAt: Logger.now(),
				});

				// consume invitation if provided
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

					// mark invitation as used
					await trx('invitation')
						.where({ invitationId: invitation.invitationId })
						.update({ userId: user.userId });

					// if workspace invitation, add user to that workspace
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

	// complete onboarding for an oauth user (set username, accept ToS)
	async completeOnboarding(userId: string, username: string): Promise<QueryResult> {
		try {
			await this.db.query.transaction(async (trx) => {
				// validate username uniqueness
				const existing = await trx('user').select('userId').where({ username }).first();
				if (existing && existing.userId !== userId) {
					throw new Error('Username already taken.');
				}

				// set username and clear onboarding flag
				await trx('user').where({ userId }).update({ username, needsOnboarding: 0 });
			});

			return { status: 'success' };
		} catch (error: any) {
			console.error('Failed to complete onboarding:', error.message);

			return {
				status: 'error',
				error:
					error.message === 'Username already taken.'
						? error.message
						: 'An error occurred. Please try again.',
			};
		}
	}
}
