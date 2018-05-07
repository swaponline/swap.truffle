var Rating        = artifacts.require("./Rating.sol");
var EthToBtcSwaps = artifacts.require("./EthToBtcSwaps.sol");
var Token         = artifacts.require("./Token.sol");

module.exports = function(deployer) {
  deployer.deploy(Token, 'Test', 'TST', 18)
  deployer.deploy(EthToBtcSwaps).then( ()=> {
    return deployer.deploy(Rating, EthToBtcSwaps.address)
  }).then(() => {
    console.log('>> success! <<<')
  })
}
