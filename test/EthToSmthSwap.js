const EthToSmthSwaps   = artifacts.require('EthToSmthSwaps')
const RatingContract   = artifacts.require('Rating')

const secret        = '0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash    = '0xc0933f9be51a284acb6b1a6617a48d795bdeaa80'
const getSwapValue  = () => 0.1e18


contract('EthToSmthSwap >', async (accounts) => {

  const Owner = accounts[0]
  const btcOwner = accounts[1]
  const ethOwner = accounts[2]

  let Swap, Rating
  let swapValue

  before('setup contract', async () => {
    Swap   = await EthToSmthSwaps.deployed()
    Rating = await RatingContract.deployed()
  })

  describe('Init >', () => {

    it('set rating contract', async () => {
      Swap.setRatingAddress(Rating.address, {
        from: Owner,
      })
    })

    it('check creator balance', async () => {
      const ethOwnerBalance = await web3.eth.getBalance(btcOwner)

      assert.isTrue(ethOwnerBalance.toNumber() >= getSwapValue(), 'not enough balance')
    })
  })

  /**
   * Scenrio #1: 'Withdraw' case
   */
  describe('Scenario #1: Withdraw case >', () => {

    describe('Create Swap >', () => {

      before('Swap init', () => {
        swapValue = getSwapValue()
      })

      it('sign swap', async () => {
        await Swap.sign(ethOwner, {
          from: btcOwner,
        })
      })

      it('create swap', async () => {
        await Swap.createSwap(secretHash, btcOwner, {
          from: ethOwner,
          value: swapValue,
        })
      })

      it('check swap', async () => {
        const result = await Swap.getInfo(ethOwner, btcOwner)

        assert.equal(result[1], secretHash, 'Invalid secretHash')
        assert.equal(result[3].toNumber(), swapValue, 'Invalid Balance')
      })
    })

    describe('Withdraw Swap >', () => {

      let btcOwnerBalance
      let withdrawCost

      before('before', async () => {
        btcOwnerBalance = await web3.eth.getBalance(btcOwner)
      })

      it('withdraw', async () => {
        const { receipt: { transactionHash, gasUsed } } = await Swap.withdraw(secret, ethOwner, {
          from: btcOwner,
        })
        const { gasPrice } = await web3.eth.getTransaction(transactionHash)

        withdrawCost = gasPrice * gasUsed
      })

      it('check participant balance', async () => {
        const _btcOwnerBalance = await web3.eth.getBalance(btcOwner)

        assert.equal(btcOwnerBalance.toNumber() - withdrawCost + swapValue, _btcOwnerBalance.toNumber())
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
        const result = await Rating.get.call(btcOwner)

        assert.equal(result.toNumber(), 1, 'invalid rating')
      })

      it('check participant rating', async () => {
        const result = await Rating.get.call(btcOwner)

        assert.equal(result.toNumber(), 1, 'invalid rating')
      })

      it('check swap cleaned', async () => {
        const result = await Swap.getInfo(ethOwner, btcOwner)

        assert.equal(result[1], '0x0000000000000000000000000000000000000000', 'Invalid TokenAddress')
      })

    })

  })

  /**
   * Scenrio #2: 'Refund' case
   */
  // describe('Scenario #2: Refund case >', () => {
  //
  //   describe('Create Swap >', () => {
  //
  //     before('Swap init', () => {
  //       swapValue = getSwapValue()
  //     })
  //
  //     it('sign swap', async () => {
  //       await Swap.sign(ethOwner, {
  //         from: btcOwner,
  //       })
  //     })
  //
  //     it('create swap', async () => {
  //       await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
  //         from: ethOwner,
  //       })
  //     })
  //
  //     it('check swap', async () => {
  //       const result = await Swap.getInfo(ethOwner, btcOwner)
  //
  //       assert.equal(result[1], secretHash, 'Invalid secretHash')
  //       assert.equal(result[3].toNumber(), swapValue, 'Invalid Balance')
  //     })
  //   })
  //
  //   describe('TimeOut >', () => {
  //
  //     it('time', (done) => {
  //       setTimeout(done, 6000)
  //     })
  //   })
  //
  //   describe('Refund Swap >', () => {
  //
  //     let ethOwnerBalance
  //
  //     before('before', async () => {
  //       ethOwnerBalance = await web3.eth.getBalance(ethOwner)
  //     })
  //
  //     it('refund', async () => {
  //       await Swap.refund(btcOwner, {
  //         from: ethOwner,
  //       })
  //     })
  //
  //     it('check creator balance', async () => {
  //       const _ethOwnerBalance = await web3.eth.getBalance(ethOwner)
  //
  //       assert.equal(ethOwnerBalance.toNumber() + swapValue, _ethOwnerBalance.toNumber())
  //     })
  //
  //     it('check participant rating', async () => {
  //       const result = await Rating.get.call(btcOwner)
  //
  //       // 0 bcs btcOwner received +1 in #1 case
  //       assert.equal(result.toNumber(), 0, 'invalid rating')
  //     })
  //
  //     it('check swap cleaned', async () => {
  //       const result = await Swap.getInfo.call(ethOwner, btcOwner)
  //
  //       assert.equal(result[1], '0x0000000000000000000000000000000000000000', 'Invalid TokenAddress')
  //     })
  //   })
  //
  // })
  //
  // /**
  //  * Scenrio #2: 'Abort' case
  //  */
  // describe('Scenario #3 Abort case >', () => {
  //
  //   describe('Init Swap >', () => {
  //
  //     it('sign swap', async () => {
  //       await Swap.sign(ethOwner, {
  //         from: btcOwner,
  //       })
  //     })
  //   })
  //
  //   describe('TimeOut >', () => {
  //
  //     it('time', (done) => {
  //       setTimeout(done, 6000)
  //     })
  //   })
  //
  //   describe('Abort >', () => {
  //
  //     it('abort', async () => {
  //       await Swap.abort(ethOwner, {
  //         from: btcOwner,
  //       })
  //     })
  //
  //     it('check creator rating', async () => {
  //       const result = await Rating.get.call(ethOwner)
  //
  //       // 0 bcs ethOwner received +1 in #1 case
  //       assert.equal(result.toNumber(), 0, 'invalid rating')
  //     })
  //   })
  //
  // })

  // TODO add test case to check abort() then ethOwner created swap

})
