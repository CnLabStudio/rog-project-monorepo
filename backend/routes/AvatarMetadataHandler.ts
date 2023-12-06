"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getMetadataByToken } from "../utils/AvartarBlindBoxMetadataDispatcher";
import PgConn from "../database/Pg";
import { getContract, getSigner } from "../utils/EthersHelper";
import { AvatarAbi } from "../abis";
import AvatarService from "../services/AvatarService";
import SoulboundService from "../services/SoulboundService";

export const metadata = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    // get token id & addr from api url
    const tokenId = Number(event.pathParameters!.tokenId);

    console.log("query token id: ", tokenId);

    // connect postgres
    const pgConn = new PgConn();
    await pgConn.init();

    try {
        const signer = getSigner();
        const contract = getContract(signer, AvatarAbi);

        const avatarService = new AvatarService(pgConn, contract);
        const soulboundService = new SoulboundService(pgConn);

        const token = await avatarService.getAvatarById(tokenId);

        // need to get which blind box should return
        // if nft is revealed, return the given metadata.
        const metadata = await getMetadataByToken(
            token,
            avatarService,
            soulboundService,
        );

        await pgConn.destroy();

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
