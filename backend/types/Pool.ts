export enum POOL_TYPE {
    GOLD,
    BLACK,
    RED,
    BLUE,
    THE,
}

export type Pool = {
    startIdx: bigint;
    size: bigint;
};
