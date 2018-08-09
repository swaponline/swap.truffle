let HDWalletProvider = require('truffle-hdwallet-provider')
let mnemonic = "prosper blame pigeon what chest volume whip toast avocado tennis hotel script"
let rinkebyURL = "https://rinkeby.infura.io/sF8QaFr5COSzwukN3V2Y"

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
    }
  },
  mocha: {
    enableTimeouts: false
  }
}
