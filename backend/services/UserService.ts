import { Client } from "pg";
import PgConn from "../database/Pg";

export default class UserService {
    private client: Client;

    constructor(pgConn: PgConn) {
        this.client = pgConn.getClient();
    }

    private lowerAddressCase(address: string): string {
        return address.toLowerCase();
    }

    async createUser(address: string): Promise<boolean> {
        const userFromDb = await this.client.query(
            `
                  insert into users (address, mint) values ($1, $2)
              `,
            [this.lowerAddressCase(address), true],
        );

        if (userFromDb.rowCount != 1) {
            return false;
        }

        return true;
    }

    async isUserMinted(address: string): Promise<boolean> {
        const userFromDb = await this.client.query(
            `
                  select id, address, mint from users where address = $1 
              `,
            [this.lowerAddressCase(address)],
        );

        if (userFromDb.rows.length == 0) {
            return false;
        }

        return true;
    }
}
