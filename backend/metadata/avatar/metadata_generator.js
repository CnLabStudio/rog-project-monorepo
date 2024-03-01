import * as fs from "fs";
import * as path from "path";

const generateMetadata = () => {
    for (let i = 0; i < 60; i++) {
        let type;
        if (i >= 0 && i < 15) {
            type = "gold";
        } else if (i >= 15 && i < 30) {
            type = "black";
        } else if (i >= 30 && i < 45) {
            type = "red";
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
