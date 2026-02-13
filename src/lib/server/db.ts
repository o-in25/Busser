const { DB_HOSTNAME, DB_USER, DB_PASSWORD, DB_PORT } = process.env;
import { camelCase } from 'change-case';
import knex from 'knex';
import { attachPaginate } from 'knex-paginate';

function convertRowKeys(row: Record<string, any>): Record<string, any> {
	const result: Record<string, any> = {};
	for (const key of Object.keys(row)) {
		result[camelCase(key)] = row[key];
	}
	return result;
}

export class DbProvider {
	private knex: knex.Knex<any, any[]>;

	public get query() {
		return this.knex;
	}

	public table<T extends {}>(table: string) {
		return this.knex<T>(table);
	}

	constructor(database: string) {
		this.knex = knex({
			client: 'mysql2',
			connection: {
				host: DB_HOSTNAME,
				port: Number(DB_PORT),
				user: DB_USER,
				password: DB_PASSWORD,
				database,
				typeCast: function (field: any, next: () => any) {
					if (field.type === 'NEWDECIMAL') {
						const val = field.string();
						return val === null ? null : Number(val);
					}
					return next();
				},
			},
			pool: { min: 0, max: 10 },
			postProcessResponse: (result) => {
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

		if (!Object.prototype.hasOwnProperty.call(this.knex, 'paginate')) {
			attachPaginate();
		}
	}
}
