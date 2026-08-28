import { camelCase } from 'change-case';
import knex from 'knex';
import { attachPaginate } from 'knex-paginate';

import { env } from '$env/dynamic/private';

const { DB_HOSTNAME, DB_USER, DB_PASSWORD, DB_PORT } = env;

export class DbProvider {
	private static instances = new Map<string, DbProvider>();
	private knex!: knex.Knex<any, any[]>;

	// connectivity heartbeat cache (per instance)
	private static readonly HEALTH_TTL = 3000;
	private healthCheckedAt = 0;
	private healthy = true;
	private healthInFlight: Promise<boolean> | null = null;

	public get query() {
		return this.knex;
	}

	public table<T extends {}>(table: string) {
		return this.knex<T>(table);
	}

	constructor(database: string) {
		if (DbProvider.instances.has(database)) {
			return DbProvider.instances.get(database)!;
		}

		this.knex = knex({
			client: 'mysql2',
			connection: {
				host: DB_HOSTNAME,
				port: Number(DB_PORT),
				user: DB_USER,
				password: DB_PASSWORD,
				database,
				connectTimeout: 4000,
				// treat naive DATETIME values as UTC on read/write, independent of process tz
				timezone: 'Z',
				typeCast: function (field: any, next: () => any) {
					if (field.type === 'NEWDECIMAL') {
						const val = field.string();
						return val === null ? null : Number(val);
					}
					return next();
				},
			},
			pool: { min: 0, max: 10 },
			acquireConnectionTimeout: 5000,
			postProcessResponse: (result) => {
				const convertRowKeys = (row: Record<string, any>): Record<string, any> => {
					const out: Record<string, any> = {};
					for (const key of Object.keys(row)) {
						out[camelCase(key)] = row[key];
					}
					return out;
				};

				if (Array.isArray(result)) {
					return result.map((row) =>
						row && typeof row === 'object' && !(row instanceof Date) ? convertRowKeys(row) : row
					);
				}
				if (result && typeof result === 'object' && !(result instanceof Date)) {
					return convertRowKeys(result);
				}
				return result;
			},
		});

		DbProvider.instances.set(database, this);

		if (!Object.prototype.hasOwnProperty.call(this.knex, 'paginate')) {
			attachPaginate();
		}
	}

	async isHealthy(): Promise<boolean> {
		if (Date.now() - this.healthCheckedAt < DbProvider.HEALTH_TTL) return this.healthy;
		if (this.healthInFlight) return this.healthInFlight;

		this.healthInFlight = (async () => {
			try {
				await this.knex.raw('select 1');
				this.healthy = true;
			} catch {
				this.healthy = false;
			}
			this.healthCheckedAt = Date.now();
			this.healthInFlight = null;
			return this.healthy;
		})();

		return this.healthInFlight;
	}
}

export const userDb = new DbProvider(env.USER_TABLE || '');
