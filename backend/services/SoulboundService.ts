import { BlindBoxType, Metadata } from "../types";
import { BlackAether, GoldAether, RedAether, TheAether } from "../metadata";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { client } from "../database/DynamoDB";

export default class SoulboundService {
    private tableName: string;
    private client: DocumentClient;

    constructor() {
        if (process.env.SOULBOUND_TABLE == undefined) {
            throw new Error("soulbound table is not set");
        }

        this.tableName = process.env.SOULBOUND_TABLE;
        this.client = client;
    }

    async getMetadataById(tokenId: number): Promise<Metadata> {
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
            const params = {
                TableName: this.tableName,
                Key: {
                    tokenId: tokenId,
                },
            };

            const res = await this.client.get(params).promise();
            if (res.Item == undefined) {
                throw new Error("Invalid Soulbound NFT");
            }

            type = res.Item.type as BlindBoxType;
        }

        return type;
    }

    async getMetadataByType(type: BlindBoxType): Promise<Metadata> {
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
            case BlindBoxType.The:
                metadata = TheAether;
                break;
            default:
                throw new Error("Invalid TokenId");
        }

        return metadata;
    }
}
