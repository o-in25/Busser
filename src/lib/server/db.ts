import { env } from '$env/dynamic/private';

const { HOSTNAME, PASSWORD, PORT, USER } = env;
import { attachPaginate } from 'knex-paginate';
import knex from 'knex';

export class DbProvider {
    private knex: knex.Knex<any, any []>;

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
              host: '127.0.0.1',
              port: 3306,
              user: 'eoin',
              password: 'XdhzqvqceAKydx9Hc7fb',
              database
            },
          pool: { min: 0, max: 10 },
        });

        if(!Object.prototype.hasOwnProperty.call(this.knex, 'paginate')) {
          attachPaginate();
        }
    }
}
