import ExcelJs from "exceljs";
import { client } from "../DynamoDB";
import { tableNames } from "./constants";

const importSoulboundTable = async (
    amount: number,
    filePath: string,
    sheetName: string,
) => {
    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet(sheetName);
    if (sheet == undefined) {
        console.log(`sheet name ${sheetName} not found`);
        return;
    }

    const rows = sheet.getRows(2, amount);
    if (rows == undefined) {
        console.log("rows not found");
        return;
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const tokenId = row.getCell(1);
        let type;
        switch (row.getCell(2).value) {
            case "Gold":
                type = 0;
                break;
            case "Black":
                type = 1;
                break;
            case "Red":
                type = 2;
                break;
        }

        const params = {
            TableName: tableNames.soulbounds,
            Item: {
                tokenId: tokenId,
                type: type,
                createdAt: new Date().getTime(),
            },
        };

        await client.put(params).promise();
    }
};

const importSignatureTable = async (
    amount: number,
    filePath: string,
    sheetName: string,
) => {
    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet(sheetName);
    if (sheet == undefined) {
        console.log(`sheet name ${sheetName} not found`);
        return;
    }

    const rows = sheet.getRows(2, amount);
    if (rows == undefined) {
        console.log("rows not found");
        return;
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const address = row.getCell(1).value?.toString().toLowerCase();
        const signature = row.getCell(2).value?.toString();

        const params = {
            TableName: tableNames.signatures,
            Item: {
                address: address,
                signature: signature,
            },
        };

        await client.put(params).promise();
    }
};

const main = async () => {
    if (process.argv.length != 6) {
        console.log("the args are not correct");
        return;
    }
    const table = process.argv[2];
    const amount = Number(process.argv[3]);
    const filePath = process.argv[4];
    const sheetName = process.argv[5];

    switch (table) {
        case "soulbound":
            await importSoulboundTable(amount, filePath, sheetName);
            break;
        case "signature":
            await importSignatureTable(amount, filePath, sheetName);
            break;
    }

    console.log(`successfully import ${table} table`);
};

main();
