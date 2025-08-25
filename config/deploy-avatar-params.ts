import 'dotenv/config'

// module.exports = [
//   '0x45F571d30157a2E548A9a5789F69558aC56955dA',
//   '0x45F571d30157a2E548A9a5789F69558aC56955dA',
//   '0x45F571d30157a2E548A9a5789F69558aC56955dA',
//   10000,
//   1000,
//   'hash',
//   'ipfshash',
// ]

export const DEPLOY_PARAMS = [
  '0xAdec0A180D24De7648ae70405b5BbA67eae45CbF',
  '0xAdec0A180D24De7648ae70405b5BbA67eae45CbF', 
  '0xAdec0A180D24De7648ae70405b5BbA67eae45CbF',
  10000,
  1000,
  'hash',
  'ipfshash',
]

export const RUNTIME_PARAMS = {
  soulboundStartTime: Math.floor(Date.now() / 1000),
  soulboundEndTime: Math.floor(Date.now() / 1000) + (7 * 24 * 3600),
  publicStartTime: Math.floor(Date.now() / 1000) + (7 * 24 * 3600),
  mintPrice: "10000000000000000"
}

module.exports = {
  DEPLOY_PARAMS,
  RUNTIME_PARAMS
}
