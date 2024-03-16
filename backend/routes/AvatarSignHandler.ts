"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SignatureService from "../services/SignatureService";

export const sign = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    try {
        if (
            event.queryStringParameters == null ||
            event.queryStringParameters.address == undefined
        ) {
            throw new Error("invalid address");
        }

        const address = event.queryStringParameters.address.toLowerCase();

        console.log("user address: ", address);

        const signatureService = new SignatureService();
        const signature = await signatureService.getSignatureByAddress(address);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": process.env.CORS ?? "*",
                "Access-Control-Allow-Methods": "GET",
            },
            body: JSON.stringify({
                signature: signature.signature,
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                message: "Error occured during signing.",
            }),
        };
    }
};
