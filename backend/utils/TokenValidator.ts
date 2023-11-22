import { FIRST_TOKEN_ID, LAST_TOKEN_ID } from "../constants";

export function isValid(values: number[]): boolean {
    const len = values.length;

    for (let i = 0; i < len; i++) {
        const value = values[i];
        // - 0.check for valid number
        if (Number.isNaN(value)) {
            return false;
        }

        // - 1.check for valid tokenId range and type
        const isValidTokenLength =
            value >= FIRST_TOKEN_ID && value < LAST_TOKEN_ID;
        if (!isValidTokenLength) {
            return false;
        }
    }

    // validation passed! return true
    return true;
}
