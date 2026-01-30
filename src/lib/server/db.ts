const { DB_HOSTNAME, DB_USER, DB_PASSWORD, DB_PORT } = process.env;
import knex from 'knex';
import { attachPaginate } from 'knex-paginate';

export class DbProvider {
	private knex: knex.Knex<any, any[]>;

	public get query() {
		return this.knex;
	}

	public table<T extends {}>(table: string) {
		return this.knex<T>(table);
	}

	// public async transaction() {
	//   const trxProvider = this.knex.transactionProvider();
	//   const trx = await trxProvider();
	//   return trx;
	// }

	constructor(database: string) {
		this.knex = knex({
			client: 'mysql',
			connection: {
				host: DB_HOSTNAME,
				port: Number(DB_PORT),
				user: DB_USER,
				password: DB_PASSWORD,
				database,
			},
			pool: { min: 0, max: 10 },
		});

		if (!Object.prototype.hasOwnProperty.call(this.knex, 'paginate')) {
			attachPaginate();
		}
	}
}
