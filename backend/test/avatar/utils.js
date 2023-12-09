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

export const mappingAvatarsToSoulbounds = async (contract) => {
    const avatarTokens = await getTokens(contract);
    const soulboundTokens = [];
    for (let i = 0; i < avatarTokens.length; i++) {
        const avatarToken = avatarTokens[i];
        const soulboundToken = await contract.avatarToSoulbound(avatarToken);
        soulboundTokens.push(Number(soulboundToken));
    }
    return soulboundTokens;
};

export const getUnusedSoulboundTokens = async (soulbound, avatar) => {
    const soulboundTokens = await getTokens(soulbound);
    const avatarTokens = await mappingAvatarsToSoulbounds(avatar);
    const availableTokens = [];
    for (let i = 0; i < soulboundTokens.length; i++) {
        const soulboundToken = soulboundTokens[i];
        if (!avatarTokens.includes(soulboundToken)) {
            availableTokens.push(soulboundToken);
        }
    }

    return availableTokens;
};

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
        const metadata = await getMetadataById(contract, token);
        console.log(`Metadata of ${type} #${token}:`, metadata);
    }
};

export const getMetadataById = async (contract, tokenId) => {
    let data;
    if (contract.target == process.env.AVATAR_ADDR) {
        // api side
        const tokenUri = await contract.tokenURI(tokenId);
        const response = await fetch(tokenUri);
        data = await response.json();
    } else {
        // contract side
        const settings = {
            apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
            network: Network.MATIC_MUMBAI, // Replace with your network.
        };

        const alchemy = new Alchemy(settings);

        // Print NFT metadata returned in the response:
        data = await alchemy.nft.getNftMetadata(contract.target, tokenId);

        data = {
            tokenId: data.tokenId,
            name: data.name,
        };
    }

    return data;
};
