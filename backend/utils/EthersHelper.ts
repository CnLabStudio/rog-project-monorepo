import { Contract, Signer, Wallet, ethers } from "ethers";

export function getSigner(): Signer {
    const provider = new ethers.JsonRpcProvider(process.env.NODE_URL!);
    return new Wallet(process.env.PRIVATE_KEY!, provider);
}

export function getContract(signer: Signer, abi: any): Contract {
    return new Contract(process.env.FREE_MINT_ADDRESS!, abi, signer);
}
