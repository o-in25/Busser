import moment from 'moment';

import { type Log } from '$lib/types';

import { DbProvider } from './db';

import { env } from '$env/dynamic/private';

const { USER_TABLE } = env;

export class Logger {
	private static db = new DbProvider(USER_TABLE || '');

	static async info(message: string): Promise<void> {
		try {
			await Logger.db.table<Log>('log').insert({
				logLevelId: 1,
				logMessage: message,
				logDate: Logger.now(),
				logStackTrace: null,
			});
		} catch (error: any) {
			console.error(error);
		}
	}

	static async error(message: string, stackTrace: string | null = null): Promise<void> {
		try {
			await Logger.db.table<Log>('log').insert({
				logLevelId: 2,
				logMessage: message,
				logDate: Logger.now(),
				logStackTrace: stackTrace,
			});
		} catch (error: any) {
			console.error(error);
		}
	}

	static now() {
		// utc so stored timestamps are tz-independent (paired with db.ts timezone: 'Z')
		return moment.utc().format('YYYY-MM-DD HH:mm:ss');
	}
}
