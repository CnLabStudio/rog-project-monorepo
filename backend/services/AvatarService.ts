import { Avatar } from "../types";
import { Contract } from "ethers";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { client } from "../database/DynamoDB";

export default class AvatarService {
    private tableName;
    private client: DocumentClient;
    private contract: Contract;

    constructor(contract: Contract) {
        if (process.env.AVATAR_TABLE == undefined) {
            throw new Error("avatar table is not set");
        }

        this.tableName = process.env.AVATAR_TABLE;
        this.client = client;
        this.contract = contract;
    }

    getTableName(): string {
        return this.tableName;
    }

    async enableReveal(): Promise<boolean> {
        const enable = await this.contract.revealed();
        return enable;
    }

    async isOwner(address: string, tokenId: number): Promise<boolean> {
        const owner = await this.contract.ownerOf(tokenId);
        return owner.toLowerCase() == address;
    }

    // get the soulboundId so that soulbound service
    // can find the corresponding blindbox type
    async getSoulboundIdById(avatarId: number): Promise<number> {
        const souldboundId = await this.contract.avatarToSoulbound(avatarId);
        return Number(souldboundId);
    }

    async createAvatar(avatar: Avatar) {
        const params = {
            TableName: this.tableName,
            Item: {
                tokenId: avatar.tokenId,
                revealed: avatar.revealed,
                createdAt: new Date().getTime(),
            },
        };

        await this.client.put(params).promise();
    }

    async getAvatarById(tokenId: number): Promise<Avatar> {
        const params = {
            TableName: this.tableName,
            Key: {
                tokenId: tokenId,
            },
        };

        const res = await this.client.get(params).promise();
        const avatar = res.Item as Avatar;

        let token: Avatar = {
            tokenId: tokenId,
            revealed: undefined,
        };

        // the nft is revealed
        if (avatar != undefined) {
            token.revealed = avatar.revealed;
        }

        return token;
    }

    async isAvatarRevealed(avatarId: number): Promise<boolean> {
        const params = {
            TableName: this.tableName,
            FilterExpression: "#tokenId = :tokenId",
            ExpressionAttributeNames: { "#tokenId": "tokenId" }, // optional names substitution
            ExpressionAttributeValues: { ":tokenId": avatarId },
            Select: "COUNT",
        };

        const res = await this.client.scan(params).promise();
        const count = res.Count;

        return count == 0 ? false : true;
    }

    // if revealedId exists in database,
    // then the metadata is revealed
    async isMetadataRevealed(revealedId: bigint): Promise<boolean> {
        const params = {
            TableName: this.tableName,
            FilterExpression: "#avatar_revealedId = :revealedId",
            ExpressionAttributeValues: {
                ":revealedId": Number(revealedId),
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
