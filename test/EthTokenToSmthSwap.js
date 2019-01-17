const EthTokenToSmthSwaps   = artifacts.require('EthTokenToSmthSwaps')
const TokenContract         = artifacts.require('Token')

const secret      = '0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash  = '0xc0933f9be51a284acb6b1a6617a48d795bdeaa80'

const timeTravel = require('./time-travel')

contract('EthTokenToSmthSwap >', async (accounts) => {

  const Owner = accounts[0]
  const btcOwner = accounts[1]
  const ethOwner = accounts[2]

  let Swap, Token
  let swapValue

  before('setup contract', async () => {
    Swap        = await EthTokenToSmthSwaps.deployed()
    Token       = await TokenContract.deployed()
  })

  describe('Init >', () => {

    it('token mint', async () => {
      await Token.mint(ethOwner, ''+10e18, {
        from: Owner,
      })
    })

    it('check balances', async () => {
      const ethOwnerBalance = await Token.balanceOf.call(ethOwner)

      assert.equal(ethOwnerBalance.toString(), ''+10e18, 'invalid balances')
    })

    it('approve', async () => {
      await Token.approve(Swap.address, ''+10e18, {
        from: ethOwner
      })
    })

    it('check approve', async () => {
      const ethOwnerApprove = await Token.allowance.call(ethOwner, Swap.address)

      assert.equal(ethOwnerApprove, ''+10e18, 'invalid approve')
    })
  })

  /**
   * Scenrio #1: 'Withdraw' case
   */
  describe('Scenario #1: Withdraw case >', () => {

    describe('Create Swap >', () => {

      before('Swap init', () => {
        swapValue = '' + 1e18
      })

      it('create swap', async () => {
        await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
          from: ethOwner,
        })
      })

      it('check balance', async () => {
        const balance = await Swap.getBalance(ethOwner, {
          from: btcOwner,
        })

        assert.equal(swapValue, balance, 'Wrong balance')
      })

      // it('check swap', async () => {
      //   const result = await Swap.getInfo(ethOwner, btcOwner)
      //
      //   assert.equal(result[0], Token.address, 'Invalid TokenAddress')
      //   assert.equal(result[2], secretHash, 'Invalid secretHash')
      //   assert.equal(result[4].toNumber(), swapValue, 'Invalid Balance')
      // })
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

        assert.equal((Number(btcOwnerBalance) + Number(swapValue)).toString(), _btcOwnerBalance.toString())
      })

      it('check secret', async () => {
        const _secret = await Swap.getSecret.call(btcOwner, {
          from: ethOwner,
        })

        assert.equal(secret, _secret)
      })

      // it('check swap cleaned', async () => {
      //   const result = await Swap.getInfo(ethOwner, btcOwner)
      //
      //   assert.equal(result[0], '0x0000000000000000000000000000000000000000', 'Invalid TokenAddress')
      // })

    })

  })

  /**
   * Scenrio #2: 'Refund' case
   */
  describe('Scenario #2: Refund case >', () => {

    describe('Create Swap >', () => {

      before('Swap init', () => {
        swapValue = '' + 1e18
      })

      it('create swap', async () => {
        await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
          from: ethOwner,
        })
      })

      it('check balance', async () => {
        const balance = await Swap.getBalance(ethOwner, {
          from: btcOwner,
        })

        assert.equal(swapValue, balance, 'Wrong balance')
      })

      // it('check swap', async () => {
      //   const result = await Swap.getInfo(ethOwner, btcOwner)
      //
      //   assert.equal(result[0], Token.address, 'Invalid TokenAddress')
      //   assert.equal(result[2], secretHash, 'Invalid secretHash')
      //   assert.equal(result[4].toNumber(), swapValue, 'Invalid Balance')
      // })
    })

    describe('TimeOut >', () => {

      // it('time', (done) => {
      //   setTimeout(done, 6000)
      // })
    })

    describe('Refund Swap >', () => {

      let ethOwnerBalance

      before('before', async () => {
        ethOwnerBalance = await Token.balanceOf.call(ethOwner)
      })

      it('refund', async () => {
        await timeTravel(3600 * 3)

        await Swap.refund(btcOwner, {
          from: ethOwner,
        })
      })

      it('check creator balance', async () => {
        const _ethOwnerBalance = await Token.balanceOf.call(ethOwner)

        assert.equal((Number(ethOwnerBalance) + Number(swapValue)).toString(), _ethOwnerBalance.toString())
      })


      // it('check swap cleaned', async () => {
      //   const result = await Swap.getInfo.call(ethOwner, btcOwner)
      //
      //   assert.equal(result[0], '0x0000000000000000000000000000000000000000', 'Invalid TokenAddress')
      // })
    })

  })

  /**
   * Scenrio #2: 'Abort' case
   */
  describe('Scenario #3 Abort case >', () => {

    describe('Init Swap >', () => {

    })

    describe('TimeOut >', () => {
      //
      // it('time', (done) => {
      //   setTimeout(done, 6000)
      // })
    })

  })

  // TODO add test case to check abort() then ethOwner created swap

})
