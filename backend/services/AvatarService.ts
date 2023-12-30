import { Client } from "pg";
import PgConn from "../database/Pg";
import { Avatar } from "../types";
import { Contract } from "ethers";

export default class AvatarService {
    private client: Client;
    private contract: Contract;

    constructor(pgConn: PgConn, contract: Contract) {
        this.client = pgConn.getClient();
        this.contract = contract;
    }

    async enableReveal(): Promise<boolean | never> {
        const enable = await this.contract.revealed();
        return enable;
    }

    // get the soulboundId so that soulbound service
    // can find the corresponding blindbox type
    async getSoulboundIdById(avatarId: number): Promise<number | never> {
        const souldboundId = await this.contract.avatarToSoulbound(avatarId);
        return souldboundId;
    }

    async createAvatar(tokenId: number, revealedId: number): Promise<boolean> {
        const tokenFromDb = await this.client.query(
            `
                  insert into avatars (token_id, revealed_id) values ($1, $2)
              `,
            [tokenId, revealedId],
        );

        if (tokenFromDb.rowCount != 1) {
            return false;
        }

        return true;
    }

    async getAvatarById(tokenId: number): Promise<Avatar> {
        const tokenFromDb = await this.client.query(
            `
                  select revealed_id from avatars where token_id = $1 
              `,
            [tokenId],
        );

        let token: Avatar = {
            tokenId: tokenId,
            revealed: undefined,
        };

        // the nft is revealed
        if (tokenFromDb.rowCount != 0) {
            token.revealed = tokenFromDb.rows[0].revealed_id;
        }

        return token;
    }

    async isAvatarRevealed(avatar_id: number): Promise<boolean> {
        const res = await this.client.query(
            `
                select count(*) from avatars where token_id = $1
            `,
            [avatar_id],
        );
        const count = Number(res.rows[0].count);

        return count == 0 ? false : true;
    }

    // if revealed_id exists in database,
    // then the metadata is revealed
    async isMetadataRevealed(revealed_id: bigint): Promise<boolean> {
        const res = await this.client.query(
            `
                  select count(*) from avatars where revealed_id = $1 
              `,
            [Number(revealed_id)],
        );
        const count = Number(res.rows[0].count);

        return count == 0 ? false : true;
    }
}
