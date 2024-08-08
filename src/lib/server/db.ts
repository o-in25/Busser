import { HOSTNAME, PASSWORD, PORT, USER } from '$env/static/private';
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
              host: HOSTNAME,
              port: Number(PORT),
              user: USER,
              password: PASSWORD,
              database
            },
          pool: { min: 0, max: 10 },
        });

        if(!Object.prototype.hasOwnProperty.call(this.knex, 'paginate')) {
          attachPaginate();
        }
    }
}
