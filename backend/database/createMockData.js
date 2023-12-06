import pkg from "pg";
const { Client } = pkg;
import config from "dotenv"
config.config()

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
        const random = Math.floor(Math.random() * 100) % 4;
        let type;
        switch (random) {
            case 0:
                type = 0;
                break;
            case 1:
                type = 1;
                break;
            case 2:
                type = 2;
                break;
            case 3:
                type = 3;
                break;
        }

        await client.query(
            `
              insert into soulbounds (token_id, type) values ($1, $2)
          `,
            [i, type],
        );
    }
};

createMockData();
