import 'dotenv/config';
import type { Knex } from 'knex';

const connection = {
	host: process.env.DB_HOSTNAME,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
};

const coreDb = process.env.CORE_DATABASE || 'app_d';
const userDb = process.env.USER_DATABASE || 'user_d';

const config: Record<string, Knex.Config> = {
	user: {
		client: 'mysql2',
		connection: { ...connection, database: userDb },
		migrations: {
			directory: './migrations/user',
			extension: 'ts',
		},
		seeds: {
			directory: './seeds/user',
			extension: 'ts',
		},
	},
	core: {
		client: 'mysql2',
		connection: { ...connection, database: coreDb },
		migrations: {
			directory: './migrations/core',
			extension: 'ts',
		},
		seeds: {
			directory: './seeds/core',
			extension: 'ts',
		},
	},
};

export default config;
