import {Client} from 'pg';

export default class PgConn {
    private client: Client;

    constructor() {
        this.client = new Client(process.env.POSTGRESQL_URL)
    }

    async init() {
        await this.client.connect()
        await this.client.query(`
            CREATE TABLE IF NOT EXISTS users
            (
                id serial not null PRIMARY KEY, 
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                address varchar(100) not null, 
                mint bool not null
            );
        `)
    }

    async insertUser(address:string) {
        const userFromDb = await this.client.query(`
            insert into users (address, mint) values ($1, $2)
        `, [address, true])

        if (userFromDb.rowCount != 1) {
            return false
        }
        return true
    }

    async queryUser(address: string) {
        const userFromDb = await this.client.query(`
            select id, address, mint from users where address = $1 
        `, [address])
        if (userFromDb.rows.length == 0) {
            return null;
        }
    
        return {
            Address: userFromDb.rows[0].address,
            Mint: userFromDb.rows[0].mint
        }
    }

    async destroy() {
        await this.client.end()
    }
}