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
        // create User table if not exists
        await this.client.query(`
            CREATE TABLE IF NOT EXISTS users
            (
                id serial not null PRIMARY KEY, 
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                address varchar(100) not null, 
                mint bool not null
            );
        `);

        // create Token table if not exists
        await this.client.query(`
            CREATE TABLE IF NOT EXISTS tokens
            (
                id serial not null PRIMARY KEY, 
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                token_id INT not null, 
                image_id INT not null
            );
        `);

        // create Soulbound table if not exists
        await this.client.query(`
            CREATE TABLE IF NOT EXISTS soul_bounds
            (
                id serial not null PRIMARY KEY, 
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                token_id INT not null, 
                type INT not null
            );
        `);
    }

    async destroy() {
        await this.client.end();
    }
}
