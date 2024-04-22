import mariadb from 'mariadb';
import { HOSTNAME, USER, PASSWORD, PORT } from '$env/static/private';
declare type ConnectionWorker = (connection: mariadb.PoolConnection) => void;

export default class {
    pool: mariadb.Pool;
    connection: mariadb.PoolConnection | null;
    
    constructor() {
        this.pool = mariadb.createPool({
            host: HOSTNAME,
            user: USER,
            password: PASSWORD,
            port: Number(PORT),
            ssl: false,
            connectTimeout: 5000,
            trace: true
        });
        this.connection = null;
    }

    async getConnection(): Promise<mariadb.PoolConnection> {
        return await new Promise(async (resolve, reject) => {
            try {
                this.connection = await this.pool.getConnection();
                resolve(this.connection);
                this.connection.release();
            } catch(error) {
                console.error(error);
                reject(error);
            }
        });
    }

}
