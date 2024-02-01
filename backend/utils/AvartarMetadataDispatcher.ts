import { Avatar, Metadata } from "../types";
import * as fs from "fs";
import * as path from "path";
import SoulboundService from "../services/SoulboundService";
import AvatarService from "../services/AvatarService";

export async function getMetadataByToken(
    avatar: Avatar,
    avatarService: AvatarService,
    soulboundService: SoulboundService,
): Promise<Metadata | never> {
    let metadata: Metadata;

    if (avatar.revealed == undefined) {
        // the nft is not revealed yet
        const soulboundId = await avatarService.getSoulboundIdById(
            avatar.tokenId
        );
        metadata = await soulboundService.getMetadataById(soulboundId);
    } else {
        // revealed metadata
        metadata = JSON.parse(
            fs.readFileSync(
                path.resolve(
                    __dirname,
                    `../metadata/avatar/${avatar.revealed}.json`,
                ),
                "utf-8",
            ),
        );
    }

    return metadata;
}
