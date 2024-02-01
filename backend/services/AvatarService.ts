import { Avatar } from "../types";
import { Contract } from "ethers";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { client } from "../database/DynamoDB";

export default class AvatarService {
    private tableName;
    private client: DocumentClient;
    private contract: Contract;

    constructor(contract: Contract) {
        this.tableName = process.env.AVATAR_TABLE!;
        this.client = client;
        this.contract = contract;
    }

    async enableReveal(): Promise<boolean | never> {
        const enable = await this.contract.revealed();
        return enable;
    }

    // get the soulboundId so that soulbound service
    // can find the corresponding blindbox type
    async getSoulboundIdById(avatarId: number): Promise<number> {
        const souldboundId = await this.contract.avatarToSoulbound(avatarId);
        return Number(souldboundId);
    }

    async createAvatar(tokenId: number, revealedId: number) {
        const params = {
            TableName: this.tableName,
            Item: {
                tokenId: tokenId,
                revealed: revealedId,
                createdAt: new Date().getTime(),
            },
        }

        await this.client.put(params).promise();
    }

    async getAvatarById(tokenId: number): Promise<Avatar> {
        const params = {
            TableName: this.tableName,
            Key: {
                id: tokenId,
            },
        }

        const res = await this.client.get(params).promise();
        const avatar = res.Item as Avatar;

        let token: Avatar = {
            tokenId: tokenId,
            revealed: undefined,
        };

        // the nft is revealed
        if (Object.keys(res).length > 0) {
            token.revealed = avatar.revealed;
        }

        return token;
    }

    async isAvatarRevealed(avatarId: number): Promise<boolean> {
        const params = {
            TableName: this.tableName,
            Key: {
                tokenId: avatarId,
            },
            Select: "COUNT",
        }

        const res = await this.client.scan(params).promise();
        const count = res.Count;

        return count == 0 ? false : true;
    }

    // if revealed_id exists in database,
    // then the metadata is revealed
    async isMetadataRevealed(revealed_id: bigint): Promise<boolean> {
        const params = {
            TableName: process.env.DYNAMODB_TABLE!,
            FilterExpression: '#avatar_revealedId = :revealedId',
            ExpressionAttributeValues: {
              ':revealedId': Number(revealed_id),
            },
            ExpressionAttributeNames: { 
              "#avatar_revealedId": "revealedId",
            },
            Select: "COUNT",
        };

        const res = await this.client.scan(params).promise();
        const count = res.Count;

        return count == 0 ? false : true;
    }
}
