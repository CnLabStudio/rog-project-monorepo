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
import SoulboundService from "../services/SoulboundService";

export async function getMetadataByToken(
    token: Token,
    contract: Contract,
    soulboundService: SoulboundService,
): Promise<Metadata | never> {
    let metadata: Metadata;

    if (token.imageId == undefined) {
        // the nft is not revealed yet
        const soulboundId = await contract.avatarToSoulbound(token.tokenId);
        metadata = await soulboundService.getSoulboundById(soulboundId);
    } else {
        // revealed metadata
        metadata = JSON.parse(
            fs.readFileSync(`../metadata/${token.tokenId}.json`, "utf-8"),
        );
        metadata.image = `${process.env.CID_PREFIX}${token.imageId}.png`;
    }

    return metadata;
}
