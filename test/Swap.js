const EthToBtcSwaps = artifacts.require("EthToBtcSwaps")
const RatingContract = artifacts.require("Rating")
const TokenContract = artifacts.require("Token")
const web3beta = require('web3')
const web3js = new web3beta(web3.currentProvider)

const secret = '0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash = '0xc0933f9be51a284acb6b1a6617a48d795bdeaa80'



contract('Swap', function (accounts) {

    const Owner = accounts[0]
    const btcOwner = accounts[1]
    const ethOwner = accounts[2]

    let Swap, Rating, erc20
    let swapValue

    before('setup contract', async function () {
        Swap   = await EthToBtcSwaps.deployed()
        Rating = await RatingContract.deployed()
        Token  = await TokenContract.deployed()
    })

    describe('init', function () {

        it('Token mint', async function () {
            await Token.mint(ethOwner, 10000 ** 18, {from: Owner})
        });


        it('check balances', async function () {
            let ethOwnerBalance = await Token.balanceOf.call(ethOwner)
            assert.equal(ethOwnerBalance.toNumber(), 10000 ** 18, 'invalid balances')
        });

        it('set rating contract', function () {
            Swap.setRatingAddress(Rating.address, {
                from: Owner
            })
        })

        it('Approve', async function () {
            await Token.approve(Swap.address, 10000 ** 18, {
                from: ethOwner
            })
        });

        it('check approve', async function () {
            let ethOwnerApprove = await Token.allowance.call(ethOwner, Swap.address)
            assert.equal(ethOwnerApprove, 10000 ** 18, 'invalid approve')
        });


    })

    /**
     * Scenrio #1: 'Withdraw' case
     */
    describe('Scenario #1', function () {
        
        describe('Create Swap', function () {


            before('Swap init', function () {
                swapValue = 100 ** 18
            })


            it('init Swap', async function () {
                await Swap.initSwap(btcOwner, {
                    from: ethOwner
                })
            });

            it('create swap', async function () {
                await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
                    from: ethOwner
                })
            })

            it('check swap', async function () {
                let result = await Swap.getInfo(ethOwner, btcOwner)
                assert.equal(result[0].toNumber(), 1, 'Invalid status')
                assert.equal(result[2], secretHash, 'Invalid secretHash')
                assert.equal(result[4].toNumber(), swapValue, 'Invalid Balance')
                assert.equal(result[5], Token.address, 'Invalid TokenAddress')
            })

        });

        describe('Withdraw Swap', function () {

            var btcOwnerBalance

            before('before', async () => {
                btcOwnerBalance = await Token.balanceOf.call(btcOwner)
            })

            it('Withdraw swap', async function () {
                await Swap.withdraw(secret, ethOwner, {
                    from: btcOwner
                })
            });

            it('Check Withdraw', async function () {
                let _btcOwnerBalance = await Token.balanceOf.call(btcOwner)
                assert.equal(btcOwnerBalance.toNumber() + swapValue, _btcOwnerBalance.toNumber())
            })

        })
    
    });

    /**
     * Scenrio #2: 'Refund' case
     */
    describe('Scenario #2', function () {
        
        describe('Create Swap', function () {


            before('Swap init', function () {
                swapValue = 1000 ** 18
            })


            it('init Swap', async function () {
                await Swap.initSwap(btcOwner, {
                    from: ethOwner
                })
            });

            it('create swap', async function () {
                await Swap.createSwap(secretHash, btcOwner, swapValue, Token.address, {
                    from: ethOwner
                })
            })

            it('check swap', async function () {
                let result = await Swap.getInfo(ethOwner, btcOwner)
                assert.equal(result[0].toNumber(), 1, 'Invalid status')
                assert.equal(result[2], secretHash, 'Invalid secretHash')
                assert.equal(result[4].toNumber(), swapValue, 'Invalid Balance')
                assert.equal(result[5], Token.address, 'Invalid TokenAddress')
            })

        });

        describe('TimeOut', function(){
            it('time', function(done){
                setTimeout(done, 12000)
            });
        })

        describe('Refund Swap', function(){
            
            it('refund', function () {
                Swap.refund(btcOwner, {from: ethOwner})
            });

            it('check swap', async function(){
                let result = await Swap.getInfo.call(ethOwner, btcOwner)
                assert.equal(result[0].toNumber(), 0, 'invalid state')
            })
            
        })
    
    });

        /**
     * Scenrio #2: 'Close' case
     */
    describe('Scenario #3', function () {
        
        describe('Init Swap', function () {

            it('init Swap', async function () {
                await Swap.initSwap(btcOwner, {
                    from: ethOwner
                })
            })

        })

        describe('TimeOut', function(){
            it('time', function(done){
                setTimeout(done, 12000)
            });
        })

        describe('Refund Swap', function(){
            
            it('Close', function () {
                Swap.close(ethOwner, {from: btcOwner})
            });

            it('check rating', async function(){
                let result = await Rating.get.call(ethOwner)
                assert.equal(result.toNumber(), -1, 'invalid rating')
            })
            
        })
    
    });

})