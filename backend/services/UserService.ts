import { Client } from "pg";
import PgConn from "../database/Pg";

export default class UserService {
  private client: Client;

  constructor(pgConn: PgConn) {
    this.client = pgConn.getClient();
  }

  async createUser(address: string) {
    const userFromDb = await this.client.query(
      `
                  insert into users (address, mint) values ($1, $2)
              `,
      [address, true],
    );

    if (userFromDb.rowCount != 1) {
      return false;
    }
    return true;
  }

  async queryUser(address: string) {
    const userFromDb = await this.client.query(
      `
                  select id, address, mint from users where address = $1 
              `,
      [address],
    );
    if (userFromDb.rows.length == 0) {
      return null;
    }

    return {
      Address: userFromDb.rows[0].address,
      Mint: userFromDb.rows[0].mint,
    };
  }
}
