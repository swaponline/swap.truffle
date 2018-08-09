const testnet = require('./testnet')
const localnet = require('./localnet')

const getConfig = require('./getConfig')

module.exports = {
  testnet: getConfig(testnet),
  localnet: getConfig(localnet),
}
