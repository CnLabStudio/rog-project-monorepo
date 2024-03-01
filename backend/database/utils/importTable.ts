import ExcelJs from "exceljs";
import { client } from "../DynamoDB";

const importTable = async () => {
    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.readFile("./database/soulbound.xlsx");

    const sheet = workbook.getWorksheet("Soulbound");
    if (sheet == undefined) {
        console.log("sheet name Soulbound not found");
        return;
    }

    const rows = sheet.getRows(2, 40);
    if (rows == undefined) {
        console.log("rows not found");
        return;
    }

    for (let i = 0; i < 40; i++) {
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
            TableName: "soulbounds",
            Item: {
                tokenId: tokenId,
                type: type,
                createdAt: new Date().getTime(),
            },
        };

        await client.put(params).promise();
    }
};

importTable();
