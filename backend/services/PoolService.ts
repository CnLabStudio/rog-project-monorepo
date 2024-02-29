import {
    POOLS,
    VRF,
} from "../constants";
import { BlindBoxType, Pool } from "../types";
import SoulboundService from "./SoulboundService";
import AvatarService from "./AvatarService";

export default class PoolService {
    private seed: bigint;
    private pools: any;
    private avatarService: AvatarService;
    private soulboundService: SoulboundService;

    constructor(
        avatarService: AvatarService,
        soulboundService: SoulboundService,
    ) {
        this.seed = VRF;
        this.pools = POOLS;
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
        const typeToNum = Number(type);
        return this.pools[typeToNum];
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
            isRevealed = await this.avatarService.isMetadataRevealed(revealedId);
        }

        // save into the db
        await this.avatarService.createAvatar(
            avatarId,
            Number(revealedId),
        );

        return Number(revealedId);
    }
}
