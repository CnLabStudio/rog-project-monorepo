import ExcelJs from "exceljs";
import dotenv from "dotenv";
import pg from "pg";
const { Client } = pg;
dotenv.config();

const exportTable = async () => {
    const workbook = new ExcelJs.Workbook();
    const sheet = workbook.addWorksheet("Soulbound");

    const client = new Client(process.env.POSTGRESQL_URL);
    await client.connect();

    const soulbounds = await client.query(
        `select token_id, type from soulbounds`,
    );

    await client.end();

    const n = soulbounds.rowCount;
    let rows = [];
    for (let i = 0; i < n; i++) {
        const row = soulbounds.rows[i];
        const rowToArr = [row.token_id];
        switch (row.type) {
            case 0:
                rowToArr.push("Gold");
                break;
            case 1:
                rowToArr.push("Black");
                break;
            case 2:
                rowToArr.push("Red");
                break;
            case 3:
                rowToArr.push("Blue");
                break;
        }

        rows.push(rowToArr);
    }

    sheet.addTable({
        ref: "A1", // 從A1開始
        columns: [{ name: "Token Id" }, { name: "Pill Type" }],
        rows: rows,
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
