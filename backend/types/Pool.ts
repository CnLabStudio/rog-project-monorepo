export enum POOL_TYPE {
    GOLD,
    BLACK,
    RED,
    THE,
}

export type Pool = {
    startIdx: bigint;
    size: bigint;
};
