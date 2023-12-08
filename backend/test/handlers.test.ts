import { eventJSON } from "./mock/event";
import { metadata } from "../routes/AvatarMetadataHandler";
import dotenv from "dotenv";
import "@types/jest";

describe("Lambda test", () => {
    before("Load Config", () => {
        dotenv.config();
    });
    describe("AvatarMetadataHandler", () => {
        it("should get the metadata successfully", async () => {
            const result: any = await metadata(eventJSON);

            const data = JSON.parse(result.body);

            // Assert that the response from the Lambda handler is successful
            expect(result.statusCode).toBe(200);
        });

        it("should failed if query invalid token id", async () => {
            // set invalid tokenId
            eventJSON.pathParameters!["tokenId"]! = "5";

            const result: any = await metadata(eventJSON);

            const data = JSON.parse(result.body);

            // Assert that the response from the Lambda handler is successful
            expect(result.statusCode).toBe(501);
            expect(data).toEqual({
                message: "Error occured during processing metadata.",
            });
        });
    });
});
