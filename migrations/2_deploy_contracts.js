const EthToSmthSwaps        = artifacts.require('./EthToSmthSwaps.sol')
const EthTokenToSmthSwaps   = artifacts.require('./EthTokenToSmthSwaps.sol')
const Token                 = artifacts.require('./Token.sol')


module.exports = function (deployer) {
  Promise.all([
    deployer.deploy(Token, 'Test', 'TST', 18),
    deployer.deploy(EthToSmthSwaps),
    deployer.deploy(EthTokenToSmthSwaps),
  ])
    .then(() => {
      console.log('>> success! <<<')
    })
}
