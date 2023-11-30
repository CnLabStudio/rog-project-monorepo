"use strict";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getContract, getSigner } from "../utils/EthersHelper";
import { AvatarAbi } from "../abis";
import TokenService from "../services/TokenService";
import PgConn from "../database/Pg";
import NftPoolService from "../services/NftPoolService";
import { TOTAL_NFT_AMOUNT } from "../constants";
import { POOL_TYPE } from "../types";

export const reveal = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    // get token id & pool type from api url
    const tokenId = Number(event.queryStringParameters!.tokenId);
    const poolType = Number(event.queryStringParameters!.poolType) as POOL_TYPE;

    console.log("reveal tokenId : ", tokenId);

    // connect postgres
    const pgConn = new PgConn();
    await pgConn.init();

    // create token service
    const tokenService = new TokenService(pgConn);

    try {
        const signer = getSigner();
        const contract = getContract(signer, AvatarAbi);

        // get chainlink vrf
        const seed = await contract.randomSeedMetadata();
        const nftPoolService = new NftPoolService(
            seed,
            TOTAL_NFT_AMOUNT,
            tokenService,
        );

        await nftPoolService.revealTokenId(poolType, tokenId);

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
