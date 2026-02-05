import 'dotenv/config';
import type { Knex } from 'knex';

const connection = {
	host: process.env.DB_HOSTNAME,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
};

const config: Record<string, Knex.Config> = {
	// user database: auth, roles, permissions, workspaces, invitations
	user: {
		client: 'mysql',
		connection: { ...connection, database: 'user_d' },
		migrations: {
			directory: './migrations/user',
			extension: 'ts',
		},
		seeds: {
			directory: './seeds/user',
			extension: 'ts',
		},
	},

	// core database: inventory, catalog, recipes
	core: {
		client: 'mysql',
		connection: { ...connection, database: 'app_d' },
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
