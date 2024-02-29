import { Contract, Signer, Wallet, ethers } from "ethers";

// TODO: need to pass node url to switch network (polygon, eth)
export function getSigner(): Signer {
    const provider = new ethers.JsonRpcProvider(process.env.NODE_URL!);
    return new Wallet(process.env.PRIVATE_KEY!, provider);
}

export function getContract(
    signer: Signer,
    address: string,
    abi: any,
): Contract {
    return new Contract(address, abi, signer);
}
