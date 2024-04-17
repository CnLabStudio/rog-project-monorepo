import { POOLS, VRF } from "../constants";
import { BlindBoxType, Pool } from "../types";
import SoulboundService from "./SoulboundService";
import AvatarService from "./AvatarService";
import { client } from "../database/DynamoDB";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default class PoolService {
    private seed: bigint;
    private pools: any;
    private avatarService: AvatarService;
    private soulboundService: SoulboundService;
    private client: DocumentClient;

    constructor(
        avatarService: AvatarService,
        soulboundService: SoulboundService,
    ) {
        this.seed = VRF;
        this.pools = POOLS;
        this.avatarService = avatarService;
        this.soulboundService = soulboundService;
        this.client = client;
    }

    // pool type
    // {
    //   start idx: BigInt,
    //   size: BigInt
    // }
    // last index = start idx + pool size
    private getPoolByType(type: BlindBoxType): Pool {
        const typeToNum = Number(type);
        return this.pools[typeToNum];
    }

    // check if the pool is all revealed
    private async isPoolFull(pool: Pool): Promise<boolean> {
        const startIdx = Number(pool.startIdx);
        const size = Number(pool.size);

        const params = {
            TableName: this.avatarService.getTableName(),
            FilterExpression: "#revealed >= :start and #revealed <= :end",
            ExpressionAttributeNames: { "#revealed": "revealed" }, // optional names substitution
            ExpressionAttributeValues: {
                ":start": startIdx,
                ":end": startIdx + size,
            },
            Select: "COUNT",
        };

        const res = await this.client.scan(params).promise();
        const count = res.Count ?? 0;

        return count < size;
    }

    // reveal the avatar tokenId will bind with
    // the given revealedId
    async revealNft(avatarId: number): Promise<number> {
        // check the contract the stage is on reveal or not
        const enableReveal = this.avatarService.enableReveal();
        if (!enableReveal) {
            throw new Error("The reveal stage is not available");
        }

        // check the avatar is revealed or not
        let isRevealed = await this.avatarService.isAvatarRevealed(avatarId);
        if (isRevealed) {
            throw new Error("This nft is revealed");
        }

        const soulboundId =
            await this.avatarService.getSoulboundIdById(avatarId);
        const type =
            await this.soulboundService.getBlindBoxTypeById(soulboundId);
        const pool = this.getPoolByType(type);

        const isPoolFull = await this.isPoolFull(pool);
        if (isPoolFull) {
            throw new Error("The pool is all revealed");
        }

        // get the revealedId
        // seed is u256, need to convert bigint to do the operation
        // using number to do it will occur overflow error
        let offset = (this.seed + BigInt(avatarId)) % pool.size;
        let revealedId = pool.startIdx + offset;
        isRevealed = await this.avatarService.isMetadataRevealed(revealedId);

        // find the revealedId which is not revealed yet
        while (isRevealed) {
            offset = (offset + 1n) % pool.size;
            revealedId = pool.startIdx + offset;
            isRevealed =
                await this.avatarService.isMetadataRevealed(revealedId);
        }

        // save into the db
        await this.avatarService.createAvatar({
            tokenId: avatarId,
            revealed: Number(revealedId),
        });

        return Number(revealedId);
    }
}
