import dotenv from "dotenv";
import { displayMetadata, getContract, getTokens } from "./utils.js";
import AvatarAbi from "../../abis/avatar_abi.json" assert { type: "json" };
import SoulboundAbi from "../../abis/soulbound_abi.json" assert { type: "json" };
import {
    mintBySoulboundHolder,
    mintPublicBlindBox,
    revealAvatar,
} from "./avatar.js";

dotenv.config();

const executeCli = async () => {
    // get the command
    const command = process.argv[2];
    const avatar = getContract(process.env.AVATAR_ADDR, AvatarAbi);
    const soulbound = getContract(process.env.SOULBOUND_ADDR, SoulboundAbi);
    switch (command) {
        case "metadata":
            const tokens = await getTokens(avatar);
            await displayMetadata(avatar, tokens);
            break;
        case "mintblindbox":
            await mintBySoulboundHolder(soulbound, avatar);
            break;
        case "mintpublic":
            await mintPublicBlindBox(avatar);
            break;
        case "reveal":
            await revealAvatar(avatar);
            break;
        default:
            break;
    }
};

executeCli();
