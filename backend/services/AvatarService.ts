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

    // get the soulboundId so that soulbound service
    // can find the corresponding blindbox type
    async getSoulboundIdById(avatarId: number): Promise<number | never> {
        const souldboundId = await this.contract.avatarToSoulbound(avatarId);
        return souldboundId;
    }

    async createAvatar(tokenId: number, imageId: number): Promise<boolean> {
        const tokenFromDb = await this.client.query(
            `
                  insert into avatars (token_id, image_id) values ($1, $2)
              `,
            [tokenId, imageId],
        );

        if (tokenFromDb.rowCount != 1) {
            return false;
        }

        return true;
    }

    async getAvatarById(tokenId: number): Promise<Avatar> {
        const tokenFromDb = await this.client.query(
            `
                  select image_id, from avatars where token_id = $1 
              `,
            [tokenId],
        );

        let token: Avatar = {
            tokenId: tokenId,
            imageId: undefined,
        };

        // the nft is revealed
        if (tokenFromDb.rows.length != 0) {
            token.imageId = Number(tokenFromDb.rows[0]);
        }

        return token;
    }

    // if imageId exists in database,
    // then the image is revealed
    async isRevealed(imageId: bigint): Promise<boolean> {
        const count = Number(
            await this.client.query(
                `
                  select count(*), from avatars where image_id = $1 
              `,
                [Number(imageId)],
            ),
        );

        return count == 0 ? false : true;
    }
}
