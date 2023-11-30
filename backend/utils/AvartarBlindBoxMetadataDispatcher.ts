import { Contract } from "ethers";
import {
    BlackAether,
    BlueAether,
    GoldAether,
    RedAether,
    TheAether,
} from "../metadata";
import { BlindBoxType, Metadata, Token } from "../types";
import * as fs from "fs";

export async function getMetadataByToken(
    token: Token,
    contract: Contract,
): Promise<Metadata | never> {
    let metadata: Metadata;

    if (token.imageId == undefined) {
        // the nft is not revealed yet
        const tokenType = await contract.getTypeByTokenId(token.tokenId);

        switch (tokenType) {
            case BlindBoxType.Golden:
                metadata = GoldAether;
                break;
            case BlindBoxType.Black:
                metadata = BlackAether;
                break;
            case BlindBoxType.Red:
                metadata = RedAether;
                break;
            case BlindBoxType.Blue:
                metadata = BlueAether;
                break;
            case BlindBoxType.The:
                metadata = TheAether;
                break;
            default:
                throw new Error("Invalid TokenId");
        }
    } else {
        // revealed metadata
        metadata = JSON.parse(
            fs.readFileSync(`../metadata/${token.tokenId}.json`, "utf-8"),
        );
        metadata.image = `${process.env.CID_PREFIX}/${token.imageId}.png`;
    }

    return metadata;
}
