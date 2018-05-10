const EthTokenToSmthSwaps   = artifacts.require('EthTokenToSmthSwaps')
const ReputationContract    = artifacts.require('Reputation')
const TokenContract         = artifacts.require('Token')

const secret      = '0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash  = '0xc0933f9be51a284acb6b1a6617a48d795bdeaa80'

contract('EthTokenToSmthSwap >', async (accounts) => {

  const Owner = accounts[0]
  const alice = accounts[3]
  const bob = accounts[4]

  let Swap, Reputation, Token
  let swapValue

  before('setup contract', async () => {
    Swap   = await EthTokenToSmthSwaps.deployed()
    Reputation = await ReputationContract.deployed()
    Token  = await TokenContract.deployed()
  })

  describe('Init >', () => {

    it('set rating contract', () => {
      Reputation.addToWhitelist(Swap.address, {
        from: Owner,
      })
      Swap.setReputationAddress(Reputation.address, {
        from: Owner,
      })
    })

  })

  /**
   * Scenario #4: zero-balance case
   */
  describe('Scenario #4 zero-balance case >', () => {
    describe('Alice without money >', () => {

      before('Swap init', () => {
        swapValue = 99e18 // > 1e18
      })

      it('has zero balance of Alice', async () => {
        const aliceBalance = await Token.balanceOf.call(alice)

        assert.equal(aliceBalance.toNumber(), 0, 'invalid balances')
      })

      it('sign swap', async () => {
        await Swap.sign(bob, {
          from: alice,
        })
      })

      it('checks sign', async () => {
        const isSigned = await Swap.checkSign(alice, {
          from: bob,
        })

        assert.isTrue(Boolean(isSigned), 'swap not signed')
      })

      it('cannot create swap', async () => {
        try {
          await Swap.createSwap(secretHash, bob, swapValue, Token.address, {
            from: alice,
          })
        } catch (error) {
          assert.equal(error.message, 'VM Exception while processing transaction: revert')
          return
        }

        assert.fail(null, null, 'Expected Swap to throw error due to low Alice balance')
      })
    })
  })
})
