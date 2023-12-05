"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getMetadataByToken } from "../utils/AvartarBlindBoxMetadataDispatcher";
import PgConn from "../database/Pg";
import TokenService from "../services/TokenService";
import { getContract, getSigner } from "../utils/EthersHelper";
import { AvatarAbi } from "../abis";
import SoulboundService from "../services/SoulboundService";

export const metadata = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    // get token id & addr from api url
    const tokenId = Number(event.pathParameters!.tokenId);

    console.log("query token id : ", tokenId);

    // connect postgres
    const pgConn = new PgConn();
    await pgConn.init();

    // create user service
    const tokenService = new TokenService(pgConn);

    const soulboundService = new SoulboundService(pgConn);

    const token = await tokenService.getTokenById(tokenId);

    try {
        const signer = getSigner();
        const contract = getContract(signer, AvatarAbi);

        // need to get which blind box should return
        // if nft is revealed, return the given metadata.
        const metadata = await getMetadataByToken(
            token,
            contract,
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
