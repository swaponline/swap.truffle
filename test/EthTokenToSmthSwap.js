const EthTokenToSmthSwaps   = artifacts.require('EthTokenToSmthSwaps')
const ReputationContract        = artifacts.require('Reputation')
const TokenContract         = artifacts.require('Token')

const secret      = '0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash  = '0xc0933f9be51a284acb6b1a6617a48d795bdeaa80'


contract('EthTokenToSmthSwap >', async (accounts) => {

  const Owner = accounts[0]
  const btcOwner = accounts[1]
  const ethOwner = accounts[2]

  const poorOwner = accounts[3]

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

    it('token mint', async () => {
      await Token.mint(ethOwner, 10000 ** 18, {
        from: Owner,
      })
    })

    it('check balances', async () => {
      const ethOwnerBalance = await Token.balanceOf.call(ethOwner)

      assert.equal(ethOwnerBalance.toNumber(), 10000 ** 18, 'invalid balances')
    })

    it('approve', async () => {
      await Token.approve(Swap.address, 10000 ** 18, {
        from: ethOwner
      })
    })

    it('check approve', async () => {
      const ethOwnerApprove = await Token.allowance.call(ethOwner, Swap.address)

      assert.equal(ethOwnerApprove, 10000 ** 18, 'invalid approve')
    })
  })

  /**
   * Scenrio #1: 'Withdraw' case
   */
  describe('Scenario #1: Withdraw case >', () => {

    describe('Create Swap >', () => {

      before('Swap init', () => {
        swapValue = 1e18
      })

      it('sign swap', async () => {
        await Swap.sign(btcOwner, {
          from: ethOwner,
        })
      })

      it('check sign', async () => {
        const isSigned = await Swap.checkSign(ethOwner, {
          from: btcOwner,
        })

        assert.isTrue(Boolean(isSigned), 'swap not signed')
      })

      it('create swap', async () => {
        await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
          from: ethOwner,
        })
      })

      it('check swap', async () => {
        const result = await Swap.getInfo(ethOwner, btcOwner)

        assert.equal(result[0], Token.address, 'Invalid TokenAddress')
        assert.equal(result[2], secretHash, 'Invalid secretHash')
        assert.equal(result[4].toNumber(), swapValue, 'Invalid Balance')
      })
    })

    describe('Withdraw Swap >', () => {

      let btcOwnerBalance

      before('before', async () => {
        btcOwnerBalance = await Token.balanceOf.call(btcOwner)
      })

      it('withdraw', async () => {
        await Swap.withdraw(secret, ethOwner, {
          from: btcOwner,
        })
      })

      it('check participant balance', async () => {
        const _btcOwnerBalance = await Token.balanceOf.call(btcOwner)

        assert.equal(btcOwnerBalance.toNumber() + swapValue, _btcOwnerBalance.toNumber())
      })

      it('check secret', async () => {
        const _secret = await Swap.getSecret.call(btcOwner, {
          from: ethOwner,
        })

        assert.equal(secret, _secret)
      })

      it('close', async () => {
        await Swap.close(btcOwner, {
          from: ethOwner,
        })
      })

      it('check creator rating', async () => {
        const result = await Reputation.get.call(btcOwner)

        assert.equal(result.toNumber(), 1, 'invalid rating')
      })

      it('check participant rating', async () => {
        const result = await Reputation.get.call(btcOwner)

        assert.equal(result.toNumber(), 1, 'invalid rating')
      })

      it('check swap cleaned', async () => {
        const result = await Swap.getInfo(ethOwner, btcOwner)

        assert.equal(result[0], '0x0000000000000000000000000000000000000000', 'Invalid TokenAddress')
      })

    })

  })

  /**
   * Scenrio #2: 'Refund' case
   */
  describe('Scenario #2: Refund case >', () => {

    describe('Create Swap >', () => {

      before('Swap init', () => {
        swapValue = 1e18
      })

      it('sign swap', async () => {
        await Swap.sign(btcOwner, {
          from: ethOwner,
        })
      })

      it('check sign', async () => {
        const isSigned = await Swap.checkSign(ethOwner, {
          from: btcOwner,
        })

        assert.isTrue(Boolean(isSigned), 'swap not signed')
      })

      it('create swap', async () => {
        await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
          from: ethOwner,
        })
      })

      it('check swap', async () => {
        const result = await Swap.getInfo(ethOwner, btcOwner)

        assert.equal(result[0], Token.address, 'Invalid TokenAddress')
        assert.equal(result[2], secretHash, 'Invalid secretHash')
        assert.equal(result[4].toNumber(), swapValue, 'Invalid Balance')
      })
    })

    describe('TimeOut >', () => {

      it('time', (done) => {
        setTimeout(done, 6000)
      })
    })

    describe('Refund Swap >', () => {

      let ethOwnerBalance

      before('before', async () => {
        ethOwnerBalance = await Token.balanceOf.call(ethOwner)
      })

      it('refund', async () => {
        await Swap.refund(btcOwner, {
          from: ethOwner,
        })
      })

      it('check creator balance', async () => {
        const _ethOwnerBalance = await Token.balanceOf.call(ethOwner)

        assert.equal(ethOwnerBalance.toNumber() + swapValue, _ethOwnerBalance.toNumber())
      })

      it('check participant rating', async () => {
        const result = await Reputation.get.call(btcOwner)

        // 0 bcs btcOwner received +1 in #1 case
        assert.equal(result.toNumber(), 0, 'invalid rating')
      })

      it('check swap cleaned', async () => {
        const result = await Swap.getInfo.call(ethOwner, btcOwner)

        assert.equal(result[0], '0x0000000000000000000000000000000000000000', 'Invalid TokenAddress')
      })
    })

  })

  /**
   * Scenrio #2: 'Abort' case
   */
  describe('Scenario #3 Abort case >', () => {

    describe('Init Swap >', () => {

      it('sign swap', async () => {
        await Swap.sign(btcOwner, {
          from: ethOwner,
        })
      })

      it('check sign', async () => {
        const isSigned = await Swap.checkSign(ethOwner, {
          from: btcOwner,
        })

        assert.isTrue(Boolean(isSigned), 'swap not signed')
      })
    })

    describe('TimeOut >', () => {

      it('time', (done) => {
        setTimeout(done, 6000)
      })
    })

    describe('Abort >', () => {

      it('abort', async () => {
        await Swap.abort(ethOwner, {
          from: btcOwner,
        })
      })

      it('check creator rating', async () => {
        const result = await Reputation.get.call(ethOwner)

        // 0 bcs ethOwner received +1 in #1 case
        assert.equal(result.toNumber(), 0, 'invalid rating')
      })
    })

  })

  // TODO add test case to check abort() then ethOwner created swap

  /**
   * Scenario #4: zero-balance case
   */
  describe('Scenario #4 zero-balance case >', () => {
    describe('poorOwner without money >', () => {

      before('Swap init', () => {
        swapValue = 99e18 // > 0
      })

      it('poorOwner has zero balance', async () => {
        const poorOwnerBalance = await Token.balanceOf.call(poorOwner)

        assert.equal(poorOwnerBalance.toNumber(), 0, 'invalid balances')
      })

      it('sign swap', async () => {
        await Swap.sign(btcOwner, {
          from: poorOwner,
        })
      })

      it('checks sign', async () => {
        const isSigned = await Swap.checkSign(poorOwner, {
          from: btcOwner,
        })

        assert.isTrue(Boolean(isSigned), 'swap not signed')
      })

      it('cannot create swap', async () => {
        try {
          await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
            from: poorOwner,
          })
        } catch (error) {
          assert.equal(error.message, 'VM Exception while processing transaction: revert')
          return
        }

        assert.fail(null, null, 'Expected Swap to throw error due to low poorOwner balance')
      })
    })
  })

})
