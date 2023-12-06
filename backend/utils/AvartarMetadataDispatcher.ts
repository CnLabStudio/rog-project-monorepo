import { Avatar, Metadata } from "../types";
import * as fs from "fs";
import SoulboundService from "../services/SoulboundService";
import AvatarService from "../services/AvatarService";

export async function getMetadataByToken(
    avatar: Avatar,
    avatarService: AvatarService,
    soulboundService: SoulboundService,
): Promise<Metadata | never> {
    let metadata: Metadata;

    if (avatar.imageId == undefined) {
        // the nft is not revealed yet
        const soulboundId = await avatarService.getSoulboundIdById(
            avatar.tokenId,
        );
        metadata = await soulboundService.getMetadataById(soulboundId);
    } else {
        // revealed metadata
        metadata = JSON.parse(
            fs.readFileSync(
                `../metadata/avatar/${avatar.tokenId}.json`,
                "utf-8",
            ),
        );
        metadata.image = `${process.env.CID_PREFIX}${avatar.imageId}.png`;
    }

    return metadata;
}
