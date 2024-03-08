"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSigner } from "../utils/EthersHelper";
import SoulboundService from "../services/SoulboundService";

export const sign = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    if (
        event.queryStringParameters == null ||
        event.queryStringParameters.address == undefined
    ) {
        throw new Error("invalid address");
    }

    const address = event.queryStringParameters.address;

    console.log("user address: ", address);

    try {
        const nodeUrl = process.env.ETH_NODE_URL;
        if (nodeUrl == undefined) {
            throw new Error("node url is not set");
        }

        const signer = getSigner(nodeUrl);

        const soulboundService = new SoulboundService();

        const isUserExist = await soulboundService.isUserExist(address);
        if (!isUserExist) {
            throw new Error(`user ${address} is not soulbound holder`);
        }

        const signature = await signer.signMessage(address);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": process.env.CORS ?? "*",
                "Access-Control-Allow-Methods": "GET",
            },
            body: JSON.stringify({
                signature: signature,
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 501,
            body: JSON.stringify(
                {
                    message: "Error occured during processing signature.",
                },
                null,
                2,
            ),
        };
    }
};
