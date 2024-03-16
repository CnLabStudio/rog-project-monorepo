import { client } from "../database/DynamoDB";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Signature } from "../types";

export default class SignatureService {
    private tableName: string;
    private client: DocumentClient;

    constructor() {
        if (process.env.SIGNATURE_TABLE == undefined) {
            throw new Error("signature table is not set");
        }

        this.tableName = process.env.SIGNATURE_TABLE;
        this.client = client;
    }

    async getSignatureByAddress(address: string): Promise<Signature> {
        const params = {
            TableName: this.tableName,
            Key: {
                address: address,
            },
        };

        const res = await this.client.get(params).promise();
        if (Object.keys(res).length == 0) {
            throw new Error("user is not soulbound holder");
        }

        const signature = res.Item as Signature;

        return signature;
    }
}
