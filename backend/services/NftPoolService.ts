import {
    BLACK_POOL_RANGE,
    BLUE_POOL_RANGE,
    GOLD_POOL_RANGE,
    RED_POOL_RANGE,
    THE_POOL_RANGE,
} from "../constants";
import { POOL_TYPE } from "../types";
import TokenService from "./TokenService";

export default class NftPoolService {
    private seed: number;
    private tokenService: TokenService;

    private pools: Map<POOL_TYPE, Array<number>> = new Map();

    private goldPool: Array<number> = [];
    private blackPool: Array<number> = [];
    private redPool: Array<number> = [];
    private bluePool: Array<number> = [];
    private thePool: Array<number> = [];

    // TODO: modify pool service
    // we will have the list of pools
    // we can store to constants like
    // GOLD_POOL_START_IDX = 0
    // GOLD_POOL_SIZE = 100
    // then we can cal the gold nft range 0 ~ 99

    constructor(seed: number, totalNft: number, tokenService: TokenService) {
        this.seed = seed;
        this.tokenService = tokenService;

        // setup mapping
        this.pools.set(POOL_TYPE.GOLD, this.goldPool);
        this.pools.set(POOL_TYPE.BLACK, this.blackPool);
        this.pools.set(POOL_TYPE.RED, this.redPool);
        this.pools.set(POOL_TYPE.BLUE, this.bluePool);
        this.pools.set(POOL_TYPE.THE, this.thePool);

        // setup token ids for each pool
        for (let i = 0; i < totalNft; i++) {
            if (this.goldPool.length < GOLD_POOL_RANGE) {
                this.goldPool.push(i);
            }

            if (this.blackPool.length < BLACK_POOL_RANGE) {
                this.blackPool.push(i);
            }

            if (this.redPool.length < RED_POOL_RANGE) {
                this.redPool.push(i);
            }

            if (this.bluePool.length < BLUE_POOL_RANGE) {
                this.bluePool.push(i);
            }

            if (this.thePool.length < THE_POOL_RANGE) {
                this.thePool.push(i);
            }
        }
    }

    // create a pool table to record 
    // 1. pool type
    // 2. pool start idx
    // 3. pool length
    // 4. last index = start idx + pool length - 1

    async revealTokenId(
        pool: POOL_TYPE,
        tokenId: number,
    ): Promise<number | never> {
        // get the given pools
        const tokens = this.pools.get(pool)!;
        const poolStartIdx = 0
        // get the index of the pools
        let tokenIndex = (this.seed + tokenId) % tokens.length;
        let isRevealed = true
        let imageId = poolStartIdx + tokenIndex
        // find the image id which is not revealed yet
        while (isRevealed) {
            imageId = poolStartIdx + ((tokenIndex + 1) % tokens.length)
            isRevealed = await this.tokenService.isRevealed(imageId)
        }
        // save into the db
        const insertResult = await this.tokenService.createToken(
            tokenId,
            imageId,
        );

        // TODO: check if this action need to interact with the contract

        if (!insertResult) {
            throw new Error("Reveal nft failed");
        }

        return imageId;
    }
}
