import { Contract, Signer, Wallet, ethers } from "ethers";

export function getSigner(nodeUrl: string): Signer {
    const provider = new ethers.JsonRpcProvider(nodeUrl);
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey == undefined) {
        throw new Error("private key is not set");
    }
    return new Wallet(privateKey, provider);
}

export function getContract(
    signer: Signer,
    address: string,
    abi: any,
): Contract {
    return new Contract(address, abi, signer);
}
