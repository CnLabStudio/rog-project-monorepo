"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getContract, getSigner } from "../utils/EthersHelper";
import { AvatarAbi } from "../abis";
import PoolService from "../services/PoolService";
import AvatarService from "../services/AvatarService";
import SoulboundService from "../services/SoulboundService";
import { AVATAR_ADDRESS } from "../constants";

export const reveal = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    // get token id from api url
    const tokenId = Number(event.pathParameters!.tokenId);

    console.log("reveal tokenId : ", tokenId);

    try {
        const nodeUrl = process.env.ETH_NODE_URL;
        if (nodeUrl == undefined) {
            throw new Error("node url is not set");
        }
        const signer = getSigner(nodeUrl);
        const contract = getContract(signer, AVATAR_ADDRESS, AvatarAbi);

        const avatarService = new AvatarService(contract);
        const soulboundService = new SoulboundService();
        const poolService = new PoolService(avatarService, soulboundService);

        const revealedId = await poolService.revealNft(tokenId);

        console.log(`Token Id: ${tokenId}, Revealed Nft: ${revealedId}`);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": process.env.CORS ?? "*",
                "Access-Control-Allow-Methods": "GET",
            },
            body: JSON.stringify({
                message: `sucessfully reveal #${tokenId}.`,
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 501,
            body: JSON.stringify(
                {
                    message: "Error occured during revealing nft.",
                },
                null,
                2,
            ),
        };
    }
};
