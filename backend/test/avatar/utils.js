import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";

export const getContract = (address, abi) => {
    const provider = new JsonRpcProvider(process.env.NODE_URL);
    const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new Contract(address, abi, wallet);
    return contract;
};

// get tokens from soulbound / avatar
export const getTokens = async (contract) => {
    const tokens = await contract.tokensOfOwner(process.env.PUBLIC_KEY);
    const mapTokens = tokens.map((token) => {
        return Number(token);
    });
    return mapTokens;
};

// get soulbound token id from avatar token id
// if soulbound token id is 0, that is public sale blind box
// don't push into array
export const mappingAvatarsToSoulbounds = async (contract) => {
    const avatarTokens = await getTokens(contract);
    const soulboundTokens = [];
    for (let i = 0; i < avatarTokens.length; i++) {
        const avatarToken = avatarTokens[i];
        const soulboundTokenBigint = await contract.avatarToSoulbound(avatarToken);
        const soulboundToken = Number(soulboundTokenBigint)
        if (soulboundToken > 0) {
            soulboundTokens.push();
        }
    }
    return soulboundTokens;
};

// if the value of avatarToSoulbound mapping are within soulboundTokens
// means that soulbound nft is redeemed
export const getUnusedSoulboundTokens = async (soulbound, avatar) => {
    const soulboundTokens = await getTokens(soulbound);
    const avatarTokens = await mappingAvatarsToSoulbounds(avatar);
    const availableTokens = [];

    const n = avatarTokens.length;
    for (let i = 0; i < n; i++) {
        const avatarTokens = avatarTokens[i];
        if (!soulboundTokens.includes(avatarTokens)) {
            availableTokens.push(avatarTokens);
        }
    }

    return availableTokens;
};

// the image of matadata of the blindbox contains
// "blind" in image url. if so, push into unrevealed
export const getUnrevealedAvatars = async (avatar) => {
    const tokens = await getTokens(avatar);
    const unrevealed = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const metadata = await getMetadataById(avatar, token);
        
        if (metadata.image.includes("blind")) {
            unrevealed.push({
                tokenId: token,
                metadata: metadata,
            });
        }
    }

    return unrevealed;
};

// display all tokens' metadata from soulbound / avatar
export const displayMetadata = async (contract, tokens) => {
    let type;
    if (contract.target == process.env.AVATAR_ADDR) {
        type = "Avatar";
    } else {
        type = "Soulbound";
    }
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const metadata = await getMetadataById(type, contract, token);
        console.log(`Metadata of ${type} #${token}:`, metadata);
    }
};

export const getMetadataById = async (contract, tokenId) => {
    let data;
    switch (type) {
        case "Avatar":
            // api side
            const tokenUri = await contract.tokenURI(tokenId);
            const response = await fetch(tokenUri);
            data = await response.json();
            break;
        case "Soulbound":
            // contract side
            const settings = {
                apiKey: process.env.ALCHEMY_API_KEY,
                network: Network.MATIC_MUMBAI,
            };

            const alchemy = new Alchemy(settings);

            data = await alchemy.nft.getNftMetadata(contract.target, tokenId);
            data = {
                tokenId: data.tokenId,
                name: data.name,
            };
            break;
    }

    return data;
};
