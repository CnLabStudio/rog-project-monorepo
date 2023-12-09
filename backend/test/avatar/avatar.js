import {
    displayMetadata,
    getTokens,
    getUnusedSoulboundTokens,
    getUnrevealedAvatars,
} from "./utils.js";
import promptSync from "prompt-sync";
const prompt = promptSync({ sigint: true });

// public sale blindbox
export const mintPublicBlindBox = async (contract) => {
    const publicPrice = await contract.publicMintPrice();
    const tx = await contract.mintByAllUser({ value: publicPrice });
    await tx.wait();

    const tokens = await getTokens(contract);
    const latestIdx = tokens.length - 1
    console.log("mint succeed, here's your avatar token:");
    await displayMetadata(contract, [tokens[latestIdx]]);
};

// soulbound holder redeem blindbox
export const mintBySoulboundHolder = async (soulbound, avatar) => {
    let tokens = await getUnusedSoulboundTokens(soulbound, avatar);
    if (tokens.length <= 0) {
        console.log("you are not soulbound holder");
        return
    }
    console.log("below is the list of available soulbound to redeem:");
    await displayMetadata(soulbound, tokens);
    const redeem = prompt("which one you want to redeem? ");

    const token = Number(redeem);
    const tx = await avatar.mintBySoulboundHolder(token);
    await tx.wait();

    console.log("mint succeed, here's your avatar token:");
    await displayMetadata(avatar, [token]);
};

export const revealAvatar = async (contract) => {
    console.log("below is the list of unrevealed avatars:");
    let tokens = await getUnrevealedAvatars(contract);

    tokens.forEach((token) => {
        console.log(token);
    });

    const tokenId = prompt(
        "please choose which blind box you are about to reveal: ",
    );

    await fetch(
        `https://vq1a6y8671.execute-api.ap-southeast-1.amazonaws.com/reveal/${tokenId}`,
        {
            method: "POST",
            body: "application/json",
        },
    );

    console.log("reveal succeed, here's the revealed result:");
    await displayMetadata(contract, [tokenId]);
};
