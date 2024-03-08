import { client } from "../database/DynamoDB";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default class UserService {
    private tableName: string;
    private client: DocumentClient;

    constructor() {
        if (process.env.USER_TABLE == undefined) {
            throw new Error("user table is not set");
        }

        this.tableName = process.env.USER_TABLE!;
        this.client = client;
    }

    private lowerAddressCase(address: string): string {
        return address.toLowerCase();
    }

    async createUser(address: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Item: {
                address: this.lowerAddressCase(address),
                mint: true,
                createdAt: new Date().getTime(),
            },
        };

        await this.client.put(params).promise();
    }

    async isUserMinted(address: string): Promise<boolean> {
        const params = {
            TableName: this.tableName,
            Key: {
                address: this.lowerAddressCase(address),
            },
            Select: "COUNT",
        };

        const res = await this.client.scan(params).promise();
        const count = res.Count;

        return count == 0 ? false : true;
    }
}
