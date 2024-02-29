export const FIRST_TOKEN_ID = 0;
export const LAST_TOKEN_ID = 10;

export const FREE_MINT_ADDRESS = "0xA2fD0Da25F0662e490bA5403D097B7D8575A76eA";
export const AVATAR_ADDRESS = "0x4aD8509Ea21B92307af21D5e2360FA42d89C7c21";

const POOL_SIZE = 15;
const GOLD_POOL = {
    startIdx: BigInt(0),
    size: BigInt(POOL_SIZE),
};
const BLACK_POOL = {
    startIdx: BigInt(15),
    size: BigInt(POOL_SIZE),
};
const RED_POOL = {
    startIdx: BigInt(30),
    size: BigInt(POOL_SIZE),
};
const THE_POOL = {
    startIdx: BigInt(45),
    size: BigInt(POOL_SIZE),
};

export const POOLS = [GOLD_POOL, BLACK_POOL, RED_POOL, THE_POOL]

export const VRF = BigInt(
    "63084183703742662283721453906071477379352411579833746620532198483423721325345",
);
