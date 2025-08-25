

# TABLE nft_info
tokenId
metadataId 
userAddress

boxTypeId
originId  default=0 (未解盲)


# TABLE origin_metadata_info
originId
metadata


# TABLE unreveal_metadata_info
boxTypeId
metadata


# TABLE phase2_holders
id
userAddress
boxTypeId // 0=金, 1=紅, 2=藍
