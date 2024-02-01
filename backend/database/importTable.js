import ExcelJs from "exceljs";
import dotenv from "dotenv";
import pkg from 'aws-sdk';
const { DynamoDB } = pkg;
dotenv.config();

let options = {
    region: 'localhost',
    endpoint: 'http://0.0.0.0:8000',
    credentials: {
      accessKeyId: 'MockAccessKeyId',
      secretAccessKey: 'MockSecretAccessKey'
    }
};

const client = new DynamoDB.DocumentClient(options);

const importTable = async () => {
    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.readFile("./database/soulbound.xlsx");

    const sheet = workbook.getWorksheet("Soulbound");

    const rows = sheet.getRows(2, 40);

    for (let i = 0; i < 40; i++) {
        const row = rows[i];
        const tokenId = row.values[1];
        let type;
        switch (row.values[2]) {
            case "Gold":
                type = 0;
                break;
            case "Black":
                type = 1;
                break;
            case "Red":
                type = 2;
                break;
            case "Blue":
                type = 3;
                break;
        }

        const params = {
            TableName: "soulbounds",
            Item: {
                tokenId: tokenId,
                type: type,
                createdAt: new Date().getTime(),
            },
        }

        await client.put(params).promise();
    }
};

importTable();