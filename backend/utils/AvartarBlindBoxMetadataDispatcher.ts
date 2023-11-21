import {
    BlackAether,
    BlueAether,
    GoldAether,
    RedAether,
    TheAether,
} from "../metadata";

interface Metadata {}

export function getMetadataById(tokenId: number): Metadata {
    let metadata: Metadata;
    switch (tokenId) {
        case 0:
            metadata = BlueAether;
            break;
        case 1:
            metadata = RedAether;
            break;
        case 2:
            metadata = BlackAether;
            break;
        case 3:
            metadata = GoldAether;
        case 4:
            metadata = TheAether;
        default:
            throw new Error("Invalid TokenId");
    }
    return metadata;
}
