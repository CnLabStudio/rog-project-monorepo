import ExcelJs from "exceljs";
import { client } from "../DynamoDB";
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

        soulbounds.push(
            ...Items.map((item) => {
                let type;
                switch (item.type) {
                    case 0:
                        type = "Gold";
                        break;
                    case 1:
                        type = "Black";
                        break;
                    case 2:
                        type = "Red";
                        break;
                }
                return [item.tokenId, type];
            }),
        );

        if (LastEvaluatedKey) {
            await recursiveProcess(LastEvaluatedKey);
        }
    };

    await recursiveProcess();

    // sort the items by id asc
    soulbounds.sort((a, b) => {
        return a[0] - b[0];
    });

    return soulbounds;
};

const exportTable = async () => {
    const workbook = new ExcelJs.Workbook();
    const sheet = workbook.addWorksheet("Soulbound");

    const soulbounds = await getAllSoulbounds();

    sheet.addTable({
        ref: "A1", // 從A1開始
        columns: [{ name: "Token Id" }, { name: "Pill Type" }],
        rows: soulbounds,
        name: "",
    });

    workbook.xlsx
        .writeFile("soulbound.xlsx")
        .then(() => {
            console.log("Done.");
        })
        .catch((error) => {
            console.log(error.message);
        });
};

exportTable();
