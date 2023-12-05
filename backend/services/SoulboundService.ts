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

    async createSoulbound(
        tokenId: number,
        type: BlindBoxType,
    ): Promise<boolean> {
        const soulboundFromDb = await this.client.query(
            `
                  insert into soul_bounds (token_id, type) values ($1, $2)
              `,
            [tokenId, type],
        );

        if (soulboundFromDb.rowCount != 1) {
            return false;
        }

        return true;
    }

    async getSoulboundById(tokenId: number): Promise<Metadata | never> {
        const soulboundFromDb = await this.client.query(
            `
                  select token_id, type from soul_bounds where token_id = $1 
              `,
            [tokenId],
        );

        const type = Number(soulboundFromDb.rows[1]) as BlindBoxType;

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
