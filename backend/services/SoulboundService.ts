import { Client } from "pg";
import PgConn from "../database/Pg";
import { BlindBoxType, Metadata } from "../types";
import {
    BlackAether,
    BlueAether,
    GoldAether,
    RedAether,
    TheAether,
} from "../metadata";

export default class SoulboundService {
    private client: Client;

    constructor(pgConn: PgConn) {
        this.client = pgConn.getClient();
    }

    async getMetadataById(tokenId: number): Promise<Metadata | never> {
        const type = await this.getBlindBoxTypeById(tokenId);
        const metadata = await this.getMetadataByType(type);
        return metadata;
    }

    // can find the soulbound nft from avatar contract
    // by method "avatarToSoulbound", if the corresponding
    // soulbound token id is 0, which means
    // the blindbox is from public sale
    async getBlindBoxTypeById(tokenId: number): Promise<BlindBoxType> {
        let type: BlindBoxType;

        if (tokenId == 0) {
            type = BlindBoxType.The;
        } else {
            const soulboundFromDb = await this.client.query(
                `
                    select type from soulbounds where token_id = $1 
                `,
                [tokenId],
            );
            type = soulboundFromDb.rows[0].type as BlindBoxType;
        }

        return type;
    }

    async getMetadataByType(type: BlindBoxType): Promise<Metadata | never> {
        let metadata: Metadata;

        switch (type) {
            case BlindBoxType.Golden:
                metadata = GoldAether;
                break;
            case BlindBoxType.Black:
                metadata = BlackAether;
                break;
            case BlindBoxType.Red:
                metadata = RedAether;
                break;
            case BlindBoxType.Blue:
                metadata = BlueAether;
                break;
            case BlindBoxType.The:
                metadata = TheAether;
                break;
            default:
                throw new Error("Invalid TokenId");
        }

        return metadata;
    }
}