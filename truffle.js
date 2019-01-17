const HDWalletProvider = require('truffle-hdwallet-provider')
const mnemonic = process.env.MNEMONIC || "prosper blame pigeon what chest volume whip toast avocado tennis hotel script"
// let rinkebyURL = "https://rinkeby.infura.io/sF8QaFr5COSzwukN3V2Y"
// let rinkebyURL = "https://tgeth.swaponline.site"
const rinkebyURL = "https://rinkeby.infura.io/JCnK5ifEPH9qcQkX0Ahl"
const mainnetURL = "https://mainnet.infura.io/JCnK5ifEPH9qcQkX0Ahl"

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: function () { return new HDWalletProvider(mnemonic, rinkebyURL) },
      gas: 5000000,
      network_id: '4',
    },
    mainnet: {
      provider: function () { return new HDWalletProvider(mnemonic, mainnetURL) },
      gas: 5000000,
      network_id: '1',
    }
  },
  mocha: {
    enableTimeouts: false
  }
}
