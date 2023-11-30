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

    async revealTokenId(
        pool: POOL_TYPE,
        tokenId: number,
    ): Promise<number | never> {
        // get the given pools
        const tokens = this.pools.get(pool)!;
        // get the index of the pools
        const tokenIndex = (this.seed + tokenId) % tokens.length;
        // get the imageId
        const imageId = tokens[tokenIndex];
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
