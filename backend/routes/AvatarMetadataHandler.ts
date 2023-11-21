"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getMetadataById } from "../utils/AvartarBlindBoxMetadataDispatcher";

export const metadata = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    // get token id & addr from api url
    let tokenId = Number(event.pathParameters!.tokenId);

    console.log("query token id : ", tokenId);

    try {
        const metadata = getMetadataById(tokenId);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": process.env.CORS ?? "*",
                "Access-Control-Allow-Methods": "GET",
            },
            body: JSON.stringify(metadata),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 501,
            body: JSON.stringify(
                {
                    message: "Error occured during processing metadata.",
                },
                null,
                2,
            ),
        };
    }
};
