import { client } from "../database/DynamoDB";
import { tableNames } from "./constants";

const createMockData = async () => {
    for (let i = 1; i <= 40; i++) {
        const type = Math.floor(Math.random() * 100) % 3;

        const params = {
            TableName: tableNames.soulbounds,
            Item: {
                tokenId: i,
                type: type,
                createdAt: new Date().getTime(),
            },
        }

        await client.put(params).promise();
    }
};

createMockData();