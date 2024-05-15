import { DATABASE, HOSTNAME, PASSWORD, PORT, USER } from '$env/static/private';
import knex from 'knex';
// import { HOSTNAME, USER, PASSWORD, PORT, DATABASE } from '$env/static/private';
export class DbProvider {
    private knex: knex.Knex<any, unknown[]>;

    public get query() {
        return this.knex;
    }

    public table<T extends {}>(table: string) {
        return this.knex<T>(table);
    }

    constructor() {
        this.knex = knex({
            client: 'mysql',
            connection: {
                host: HOSTNAME,
                port: Number(PORT),
                user: USER,
                password: PASSWORD,
                database: DATABASE
            },
            pool: { min: 0, max: 7 },
        });

    }



}