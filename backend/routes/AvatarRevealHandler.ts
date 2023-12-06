"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getContract, getSigner } from "../utils/EthersHelper";
import { AvatarAbi } from "../abis";
import PgConn from "../database/Pg";
import PoolService from "../services/PoolService";
import AvatarService from "../services/AvatarService";
import SoulboundService from "../services/SoulboundService";

export const reveal = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    // get token id & pool type from api url
    const tokenId = Number(event.queryStringParameters!.tokenId);

    console.log("reveal tokenId : ", tokenId);

    // connect postgres
    const pgConn = new PgConn();
    await pgConn.init();

    try {
        const signer = getSigner();
        const contract = getContract(signer, AvatarAbi);

        const avatarService = new AvatarService(pgConn, contract);
        const soulboundService = new SoulboundService(pgConn);
        const poolService = new PoolService(avatarService, soulboundService);

        const imageId = await poolService.revealImage(tokenId);

        await pgConn.destroy();

        console.log(`Token Id: ${tokenId}, Revealed Imaged: ${imageId}`);

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
