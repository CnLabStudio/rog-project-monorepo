"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const metadata = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // get token id & addr from api url
  let firstTokenId = Number(event.queryStringParameters!.firstTokenId);
  let secondTokenId = Number(event.queryStringParameters!.secondTokenId);
  let address = event.queryStringParameters!.address!;

  console.log("first free mint tokenId : ", firstTokenId);
  console.log("second free mint tokenId : ", secondTokenId);
  console.log("user eth address : ", address);

  try {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": process.env.CORS ?? "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({
        message: `sucessfully mint #${firstTokenId} & #${secondTokenId} to ${address}.`,
      }),
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
