import { Client } from "pg";
import PgConn from "../database/Pg";
import { Token } from "../types/Token";

export default class TokenService {
    private client: Client;

    constructor(pgConn: PgConn) {
        this.client = pgConn.getClient();
    }

    async createToken(tokenId: number, imageId: number): Promise<boolean> {
        const tokenFromDb = await this.client.query(
            `
                  insert into tokens (token_id, image_id) values ($1, $2)
              `,
            [tokenId, imageId],
        );

        if (tokenFromDb.rowCount != 1) {
            return false;
        }

        return true;
    }

    async getTokenById(tokenId: number): Promise<Token | never> {
        const tokenFromDb = await this.client.query(
            `
                  select token_id, image_id, from tokens where token_id = $1 
              `,
            [tokenId],
        );

        let token = {
            tokenId: tokenId,
            imageId: undefined,
        };

        // the nft is revealed
        if (tokenFromDb.rows.length != 0) {
            token.imageId = tokenFromDb.rows[1];
        }

        return token;
    }

    async isRevealed(imageId: number): Promise<boolean> {
        const count = Number(await this.client.query(
            `
                  select count(*), from tokens where image_id = $1 
              `,
            [imageId],
        ))

        return count == 0 ? false : true
    }
}
