import * as fs from "fs";
import * as path from "path";

const generateMetadata = () => {
    for (let i = 0; i < 50; i++) {
        let type;
        if (i >= 0 && i < 10) {
            type = "gold";
        } else if (i >= 10 && i < 20) {
            type = "black";
        } else if (i >= 20 && i < 30) {
            type = "red";
        } else if (i >= 30 && i < 40) {
            type = "blue";
        } else {
            type = "the";
        }

        const metadata = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, `${type}_template.json`),
                "utf-8",
            ),
        );

        metadata.name = metadata.name + ` #${i}`;
        metadata.image = `ipfs://QmSWQH8ShTHxju36SnqiKg5svHULQp8fpeX7GmMekJDf6a/${i}.png`;

        fs.writeFileSync(
            path.join(__dirname, `./${i}.json`),
            JSON.stringify(metadata),
        );
    }
};

generateMetadata();
