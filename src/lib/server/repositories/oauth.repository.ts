import { Logger } from '../logger';
import { BaseRepository } from './base.repository';

export interface OAuthIdentity {
	oauthIdentityId: number;
	userId: string;
	provider: string;
	providerUserId: string;
	email: string | null;
	createdDate: string;
	lastLoginDate: string | null;
}

export class OAuthRepository extends BaseRepository {
	async findByProviderUserId(provider: string, providerUserId: string): Promise<OAuthIdentity | null> {
		try {
			const row = await this.db
				.table<OAuthIdentity>('oauthIdentity')
				.where({ provider, providerUserId })
				.first();
			return row ?? null;
		} catch (error: any) {
			console.error('Error finding OAuth identity:', error.message);
			return null;
		}
	}

	async findByUserId(userId: string): Promise<OAuthIdentity[]> {
		try {
			return await this.db.table<OAuthIdentity>('oauthIdentity').where({ userId });
		} catch (error: any) {
			console.error('Error finding OAuth identities for user:', error.message);
			return [];
		}
	}

	async create(
		userId: string,
		provider: string,
		providerUserId: string,
		email: string | null
	): Promise<OAuthIdentity | null> {
		try {
			const [oauthIdentityId] = await this.db.table('oauthIdentity').insert({
				userId,
				provider,
				providerUserId,
				email,
				createdDate: Logger.now(),
				lastLoginDate: Logger.now(),
			});

			return await this.db
				.table<OAuthIdentity>('oauthIdentity')
				.where({ oauthIdentityId })
				.first() ?? null;
		} catch (error: any) {
			console.error('Error creating OAuth identity:', error.message);
			return null;
		}
	}

	async updateLastLogin(oauthIdentityId: number): Promise<void> {
		try {
			await this.db
				.table('oauthIdentity')
				.where({ oauthIdentityId })
				.update({ lastLoginDate: Logger.now() });
		} catch (error: any) {
			console.error('Error updating OAuth last login:', error.message);
		}
	}
}
