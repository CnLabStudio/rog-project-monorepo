"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getMetadataByToken } from "../utils/AvartarMetadataDispatcher";
import { getContract, getSigner } from "../utils/EthersHelper";
import { AvatarAbi } from "../abis";
import AvatarService from "../services/AvatarService";
import SoulboundService from "../services/SoulboundService";
import { AVATAR_ADDRESS } from "../constants";

export const metadata = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    if (
        event.pathParameters == null ||
        event.pathParameters.tokenId == undefined
    ) {
        throw new Error("invalid token id");
    }
    
    // get token id from api url
    const tokenId = Number(event.pathParameters.tokenId);

    console.log("query token id: ", tokenId);

    try {
        const nodeUrl = process.env.ETH_NODE_URL;
        if (nodeUrl == undefined) {
            throw new Error("node url is not set");
        }

        const signer = getSigner(nodeUrl);
        const contract = getContract(signer, AVATAR_ADDRESS, AvatarAbi);

        const avatarService = new AvatarService(contract);
        const soulboundService = new SoulboundService();

        const token = await avatarService.getAvatarById(tokenId);

        // need to get which blind box should return
        // if nft is revealed, return the given metadata.
        const metadata = await getMetadataByToken(
            token,
            avatarService,
            soulboundService,
        );

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
