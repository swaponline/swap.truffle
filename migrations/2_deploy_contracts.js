const Reputation              = artifacts.require('./Reputation.sol')
const EthToSmthSwaps      = artifacts.require('./EthToSmthSwaps.sol')
const EthTokenToSmthSwaps = artifacts.require('./EthTokenToSmthSwaps.sol')
const Token               = artifacts.require('./Token.sol')


module.exports = function (deployer) {
  Promise.all([
    deployer.deploy(Token, 'Test', 'TST', 18),
    deployer.deploy(Reputation),
    deployer.deploy(EthToSmthSwaps),
    deployer.deploy(EthTokenToSmthSwaps),
  ])
    .then(() => {
      console.log('>> success! <<<')
    })
}
