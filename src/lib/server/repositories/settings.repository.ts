import type { AppSetting } from '$lib/types/auth';

import { BaseRepository } from './base.repository';

export class SettingsRepository extends BaseRepository {
	async get(key: string): Promise<string | null> {
		try {
			const row = await this.db.table<AppSetting>('appSetting').where({ settingKey: key }).first();
			return row?.settingValue ?? null;
		} catch (error: any) {
			// table may not exist yet if migration hasn't run
			if (error.code === 'ER_NO_SUCH_TABLE') return null;
			throw error;
		}
	}

	async set(key: string, value: string): Promise<void> {
		const exists = await this.db.table('appSetting').where({ settingKey: key }).first();
		if (exists) {
			await this.db.table('appSetting').where({ settingKey: key }).update({ settingValue: value });
		} else {
			await this.db.table('appSetting').insert({ settingKey: key, settingValue: value });
		}
	}

	async isInviteOnly(): Promise<boolean> {
		const value = await this.get('invite_only_mode');
		return value !== 'false';
	}
}
