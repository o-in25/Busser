import 'dotenv/config';
import type { Knex } from 'knex';

const connection = {
	host: process.env.DB_HOSTNAME,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
};

// schema is env-driven: the migrate:*:prod scripts set CORE_DATABASE/USER_DATABASE to the _p
// schemas; everything else falls back to the dev _d schemas.
const coreDatabase = process.env.CORE_DATABASE || 'app_d';
const userDatabase = process.env.USER_DATABASE || 'user_d';

const config: Record<string, Knex.Config> = {
	// user database: auth, roles, permissions, workspaces, invitations
	user: {
		client: 'mysql2',
		connection: { ...connection, database: userDatabase },
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
		client: 'mysql2',
		connection: { ...connection, database: coreDatabase },
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
