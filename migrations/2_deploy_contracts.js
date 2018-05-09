const EthToSmthSwaps      = artifacts.require('./EthToSmthSwaps.sol')
const EthTokenToSmthSwaps = artifacts.require('./EthTokenToSmthSwaps.sol')
const Token               = artifacts.require('./Token.sol')


module.exports = function (deployer) {
  Promise.all([
    deployer.deploy(Token, 'Test', 'TST', 18),
    deployer.deploy(EthToSmthSwaps).then(() => {
      const Rating = artifacts.require('./Rating.sol')
      return deployer.deploy(Rating, EthToSmthSwaps.address)
    }),
    deployer.deploy(EthTokenToSmthSwaps).then(() => {
      const Rating2 = artifacts.require('./Rating2.sol')
      return deployer.deploy(Rating2, EthTokenToSmthSwaps.address)
    }),
  ])
    .then(() => {
      console.log('>> success! <<<')
    })
}
