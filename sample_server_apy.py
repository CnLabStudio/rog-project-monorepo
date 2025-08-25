@Get('/metadata/{metadataId}')
def get_metadata(metadataId: int):
    nft_info = db.query(f"SELECT * FROM nft_info WHERE metadataId = {metadataId}")
    if(nft_info.originId == 0):
      unreveal_metadata_info = db.query(f"SELECT * FROM unreveal_metadata_info WHERE boxTypeId = {nft_info.boxTypeId}")
      return unreveal_metadata_info
    
    else:
      origin_metadata_info = db.query(f"SELECT * FROM origin_metadata_info WHERE originId = {nft_info.originId}")
      return origin_metadata_info
