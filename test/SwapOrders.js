const EthToSmthSwaps      = artifacts.require('EthToSmthSwaps')
const EthTokenToSmthSwaps = artifacts.require('EthTokenToSmthSwaps')

const fs = require('fs')
const rimraf = require('rimraf')

const setupSwapApp = require('./setupSwapApp')

const { Swap } = require('swap.core')

const { spawn } = require('child_process')

// const secret        = '0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash    = '0xc0933f9be51a284acb6b1a6617a48d795bdeaa80'

const timeTravel = require('./time-travel')
const timePassed = require('./time-passed')

const _ORDER = require('./fixtures/_order')

let app, dummy, ETH, TOKEN, room, orders


contract('swap.core >', (accounts) => {

  before(async () => {
    ETH     = await EthToSmthSwaps.deployed()
    TOKEN   = await EthTokenToSmthSwaps.deployed()
    console.log('ETH contract', ETH.address)
  })

  before(done => {
    fs.mkdir('./.storage', (err) => done())
  })

  before(() => {
    dummy = spawn('node', ['test/dummy', ETH.address, TOKEN.address])

    // dummy.stdout.on('data', data => console.log(`dummy stdout: ${data}`))
    dummy.stderr.on('data', data => console.error(`dummy stderr: ${data}`))

    dummy.on('close', code => console.log(`dummy process exited with code ${code}`))
  })

  before(done => {
    web3.eth.getAccounts((err, accs) => {
      app = setupSwapApp({
        network: 'localnet',
        account: { isAccount: true, account: accs[1] },
        contracts: { ETH, TOKEN }
      })

      room = app.services.room
      orders = app.services.orders

      if (!room.roomName)
        room.on('ready', done)
    })
  })

  before(() => {
    orders.getMyOrders()
      .map(({ id }) => orders.remove(id))
  })

  it('loaded well', () => {
    assert.equal(room.roomName, 'localnet.swap.online')

    assert.isTrue(app.isLocalNet())
  })

  it('signs and parses correctly', () => {
    room.sendMessage('hello')
  })

  it('can create order', () => {
    orders.remove()
    orders.create(_ORDER)

    const myOrders = orders.items
      .filter(({ isMy }) => isMy)
      .map(({ buyCurrency, sellCurrency, buyAmount, sellAmount }) => ({ buyCurrency, sellCurrency, buyAmount, sellAmount }))

    assert.isAbove(myOrders.length, 0, 'array of orders is not empty')

    const { buyCurrency, sellCurrency, buyAmount, sellAmount } = myOrders[0]

    assert.equal(buyCurrency, _ORDER.buyCurrency, 'order sets right currency')
    assert.equal(buyAmount.comparedTo(_ORDER.buyAmount), 0, 'order has right amount')
  })

  it('can request freeze funds', async () => {
    const participantAddress = accounts[2]
    const amount = 0.1

    const data = { secretHash, participantAddress, amount }

    await app.swaps.ETH.create(data, (hash) => {
      console.log('hash', hash)
    })

    const _swap = await ETH.swaps(accounts[1], participantAddress)

    const [ owner, recip, created, balance ] = _swap

    const _balance = web3.toWei(amount)

    assert.equal(balance.comparedTo(_balance), 0, 'fund script')

    assert.isTrue(true)
  })

  it('and refund funds after timeout', async () => {
    await timeTravel(3600 * 4)

    const participantAddress = accounts[2]

    const data = { participantAddress }

    const res = await app.swaps.ETH.refund(data, (hash) => {
      console.log('refund hash', hash)
    })

    const _swap = await ETH.swaps(accounts[1], participantAddress)

    const [ owner, recip, created, balance ] = _swap

    assert.equal(balance.comparedTo(0), 0, 'fund script')

  })

  it('can request order', async () => {
    await timePassed(12000)

    const _orderList = orders.items.filter( o => !o.isMy)

    assert.isAbove(_orderList.length, 0, 'dummy sets an order')

    const order = _orderList[0]

    order.sendRequest(() => {})

    await timePassed(2000)

    assert.isTrue(order.isRequested, 'request succeeds')

  }).timeout(20000)

  it('starts swap', async () => {
    const _orderList = orders.items.filter(o => o.isRequested)

    assert.isAbove(_orderList.length, 0, 'requested order stays requested')

    const order = _orderList[0]

    const swap = new Swap(order.id)

    await timePassed(3000)

    assert.isAbove(swap.flow.state.step, 0, 'swap started')

    return Promise.resolve()
  })

  after(done => rimraf('.ipfs', done))
  after(done => rimraf('.storage', done))
  after(() => dummy.kill())

  after(() => { setInterval(() => process.exit(), 10000) })

  after(() => room.connection.off('peer joined', room._handleUserOnline))
  after(() => room.connection.off('peer left', room._handleUserOffline))
  after(() => room.connection.off('message', room._handleNewMessage))

})
