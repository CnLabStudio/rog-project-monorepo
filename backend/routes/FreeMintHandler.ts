"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import PgConn from "../database/Pg";
import { getContract, getSigner } from "../utils/EthersHelpers";
import { isValid } from "../utils/TokenValidator";
import UserService from "../services/UserService";
import ABI from "../abis/freemint_abi.json";

export const mint = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // get token id & addr from api url
  let firstTokenId = Number(event.queryStringParameters!.firstTokenId);
  let secondTokenId = Number(event.queryStringParameters!.secondTokenId);
  let address = event.queryStringParameters!.address!;

  console.log("first free mint tokenId : ", firstTokenId);
  console.log("second free mint tokenId : ", secondTokenId);
  console.log("user eth address : ", address);

  const pgConn = new PgConn();
  const userService = new UserService(pgConn);

  const userMinted = await userService.queryUser(address);

  // input data validation
  if (!isValid([firstTokenId, secondTokenId]) || userMinted) {
    console.error("Validation Failed");
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: "Validation Failed!",
        },
        null,
        2,
      ),
    };
  }

  try {
    const signer = getSigner();
    const contract = getContract(signer, ABI);

    const tx = await contract.airdropInPair(
      firstTokenId,
      secondTokenId,
      address,
    );
    await tx.wait();

    const insertResult = await userService.createUser(address);

    await pgConn.destroy();

    if (!insertResult) {
      throw new Error("Mint nft failed");
    }

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
          message: "Error occured during minting nft.",
        },
        null,
        2,
      ),
    };
  }
};
