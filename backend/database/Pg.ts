import { Client } from "pg";

export default class PgConn {
    private client: Client;

    constructor() {
        this.client = new Client(process.env.POSTGRESQL_URL);
    }

    getClient() {
        return this.client;
    }

    async init() {
        await this.client.connect();
        await this.client.query(`
            CREATE TABLE IF NOT EXISTS users
            (
                id serial not null PRIMARY KEY, 
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                address varchar(100) not null, 
                mint bool not null
            );
        `);
    }

    async destroy() {
        await this.client.end();
    }
}
