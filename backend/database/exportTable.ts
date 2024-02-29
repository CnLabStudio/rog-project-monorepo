import ExcelJs from "exceljs";
import { client } from "../database/DynamoDB";
import { Key } from "aws-sdk/clients/dynamodb";
import { tableNames } from "./constants";

const getAllSoulbounds = async () => {
    const soulbounds: any[] = [];
  
    // get all items from table
    const recursiveProcess = async (lastEvaluatedKey?: Key) => {
      const { Items = [], LastEvaluatedKey } = await client
        .scan({
          TableName: tableNames.soulbounds,
          ExclusiveStartKey: lastEvaluatedKey,
        })
        .promise();

        soulbounds.push(...Items);
  
      if (LastEvaluatedKey) {
        await recursiveProcess(LastEvaluatedKey);
      }
    }
  
    await recursiveProcess();

    // sort the items by id asc
    soulbounds.sort((a, b) => {
        return a.tokenId - b.tokenId;
    })
  
    return soulbounds;
  }

const exportTable = async () => {
    const workbook = new ExcelJs.Workbook();
    const sheet = workbook.addWorksheet("Soulbound");

    const soulbounds = await getAllSoulbounds();
    const n = soulbounds.length;
    let rows: any[] = [];
    soulbounds.forEach(soulbound => {
        const rowToArr = [soulbound.tokenId];
        switch (soulbound.type) {
            case 0:
                rowToArr.push("Gold");
                break;
            case 1:
                rowToArr.push("Black");
                break;
            case 2:
                rowToArr.push("Red");
                break;
        }

        rows.push(rowToArr);
    });

    sheet.addTable({
        ref: "A1", // 從A1開始
        columns: [{ name: "Token Id" }, { name: "Pill Type" }],
        rows: rows,
        name: ""
    });

    workbook.xlsx
        .writeFile("./database/soulbound.xlsx")
        .then(() => {
            console.log("Done.");
        })
        .catch((error) => {
            console.log(error.message);
        });
};

exportTable();
