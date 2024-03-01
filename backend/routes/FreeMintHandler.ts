"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getContract, getSigner } from "../utils/EthersHelper";
import { isValid } from "../utils/TokenValidator";
import UserService from "../services/UserService";
import { FreeMintAbi } from "../abis";
import { FREE_MINT_ADDRESS } from "../constants";

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

    // create user service
    const userService = new UserService();

    // fetch user data
    const userMinted = await userService.isUserMinted(address);

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
        const nodeUrl = process.env.POLYGON_NODE_URL;
        if (nodeUrl == undefined) {
            throw new Error("node url is not set");
        }
        const signer = getSigner(nodeUrl);
        const contract = getContract(signer, FREE_MINT_ADDRESS, FreeMintAbi);

        // airdrop nfts to the given address
        const tx = await contract.airdropInPair(
            firstTokenId,
            secondTokenId,
            address,
        );
        await tx.wait();

        // save user minted record into db
        await userService.createUser(address);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
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
