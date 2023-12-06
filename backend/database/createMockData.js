import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
dotenv.config();

// create soulbounds data
const createMockData = async () => {
    const client = new Client(process.env.POSTGRESQL_URL);
    await client.connect();

    // create Soulbound table if not exists
    await client.query(`
        CREATE TABLE IF NOT EXISTS soulbounds
        (
            id serial not null PRIMARY KEY, 
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            token_id INT not null, 
            type INT not null
        );
    `);

    await insertMockData(client);

    await client.end();
};

const insertMockData = async (client) => {
    for (let i = 1; i <= 40; i++) {
        const type = Math.floor(Math.random() * 100) % 4;

        await client.query(
            `
              insert into soulbounds (token_id, type) values ($1, $2)
          `,
            [i, type],
        );
    }
};

createMockData();
