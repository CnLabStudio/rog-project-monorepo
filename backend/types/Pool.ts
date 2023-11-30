export enum POOL_TYPE {
    GOLD,
    BLACK,
    RED,
    BLUE,
    THE,
}

export type Pool = {
    type: POOL_TYPE;
    tokens: Array<number>;
};
