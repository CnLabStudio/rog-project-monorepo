"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Contract, Signer, Wallet, ethers } from "ethers";
import ABI from "./abi.json";

function getSigner(): Signer {
  const provider = new ethers.JsonRpcProvider(process.env.NODE_URL!)
  // search how to use aws secret manager and replace the access of pk with secret manager
  return new Wallet(process.env.PRIVATE_KEY!, provider)
}

function getContract(signer: Signer): Contract {
  return new Contract(process.env.FREE_MINT_ADDRESS!, ABI, signer)
}

function isValid(value: number): boolean {
  // - 0.check for valid number
  if (Number.isNaN(value)) {
    return false;
  }

  // - 1.check for valid tokenId range and type
  const isValidTokenLength = value >= 0 && value < 10;
  if (!isValidTokenLength) {
    return false;
  }

  // validation passed! return true
  return true;
}

export const mint = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("PRIVATE_KEY", process.env.PRIVATE_KEY!)

  // get token id & addr from api url
  let firstTokenId: number;
  let secondTokenId: number;
  let address: string;

  firstTokenId = Number(event.queryStringParameters!.firstTokenId);
  secondTokenId = Number(event.queryStringParameters!.secondTokenId);
  address = event.queryStringParameters!.address!;

  console.log("first free mint tokenId : ", firstTokenId);
  console.log("second free mint tokenId : ", secondTokenId);
  console.log("user eth address : ", address);

  // input data validation
  if (!isValid(firstTokenId) || !isValid(secondTokenId)) {
    console.error("Validation Failed");
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: "Validation Failed!",
        },
        null,
        2
      ),
    };
  }

  try {
    const signer = getSigner()
    const contract = getContract(signer)

    const uriPrefix = await contract.uriPrefix()

    // await contract.airdropInPair(firstTokenId, secondTokenId, address)

    // return two token uri?
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: JSON.stringify({uriPrefix: uriPrefix}),
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
        2
      ),
    };
  }
};