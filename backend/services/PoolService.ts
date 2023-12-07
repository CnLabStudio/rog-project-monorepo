import {
    BLACK_POOL,
    BLUE_POOL,
    GOLD_POOL,
    RED_POOL,
    THE_POOL,
    VRF,
} from "../constants";
import { BlindBoxType, Pool } from "../types";
import SoulboundService from "./SoulboundService";
import AvatarService from "./AvatarService";

export default class PoolService {
    private seed: bigint;
    private avatarService: AvatarService;
    private soulboundService: SoulboundService;

    constructor(
        avatarService: AvatarService,
        soulboundService: SoulboundService,
    ) {
        this.seed = VRF;
        this.avatarService = avatarService;
        this.soulboundService = soulboundService;
    }

    // pool type
    // {
    //   start idx: BigInt,
    //   size: BigInt
    // }
    // last index = start idx + pool size
    private getPoolByType(type: BlindBoxType): Pool {
        let pool: Pool;
        switch (type) {
            case BlindBoxType.Golden:
                pool = GOLD_POOL;
                break;
            case BlindBoxType.Black:
                pool = BLACK_POOL;
                break;
            case BlindBoxType.Red:
                pool = RED_POOL;
                break;
            case BlindBoxType.Blue:
                pool = BLUE_POOL;
                break;
            case BlindBoxType.The:
                pool = THE_POOL;
                break;
        }
        return pool;
    }

    // reveal the avatar tokenId will bind with
    // the given revealedId
    async revealNft(avatarId: number): Promise<number | never> {
        // check the contract the stage is on reveal or not
        const enableReveal = this.avatarService.enableReveal();
        if (!enableReveal) {
            throw new Error("The reveal stage is not available");
        }

        const soulboundId =
            await this.avatarService.getSoulboundIdById(avatarId);
        const type =
            await this.soulboundService.getBlindBoxTypeById(soulboundId);
        const pool = this.getPoolByType(type);

        // get the revealedId
        // seed is u256, need to convert bigint to do the operation
        // using number to do it will occur overflow error
        let offset = (this.seed + BigInt(avatarId)) % pool.size;
        let revealedId = pool.startIdx + offset;
        let isRevealed = await this.avatarService.isRevealed(revealedId);

        // find the revealedId which is not revealed yet
        while (isRevealed) {
            offset = (offset + 1n) % pool.size;
            revealedId = pool.startIdx + offset;
            isRevealed = await this.avatarService.isRevealed(revealedId);
        }

        // save into the db
        const insertResult = await this.avatarService.createAvatar(
            avatarId,
            Number(revealedId),
        );

        if (!insertResult) {
            throw new Error("Reveal nft failed");
        }

        return Number(revealedId);
    }
}
