import mariadb from 'mariadb';
import { HOSTNAME, USER, PASSWORD, PORT } from '$env/static/private';

export default class {
    static async connect() {
        const conn = mariadb.createPool({
            host: HOSTNAME,
            user: USER,
            password: PASSWORD,
            port: Number(PORT),
            ssl: false,
            connectTimeout: 5000,
            trace: true

        });
        
 try {

    const res = await conn.query('SELECT * FROM barback.Users');

    console.log(res); // [{ "1": 1 }]
    return res;
   } catch(e) {
    console.error(e)
   }
   
   finally {
    conn.end();
   }
    }
}
