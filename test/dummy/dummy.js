const { Swap } = require('swap.core')

const _ORDER_BID = require('../fixtures/_order_bid')
const _ORDER_ASK = require('../fixtures/_order_ask')

let _swaps = []

const ETH   = { address: process.argv[2] }
const TOKEN = { address: process.argv[3] }

const SECRET = '0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'

let Room, Orders

const isSwapStarted = ({ id }) => {
  const results = _swaps.filter(swap => swap.id === id)
  return results.length > 0 ? results[0] : null
}

const startSwap = (order) => {
  let swap
  if (swap = isSwapStarted(order)) {
    console.warn(`swap ${order.id} already started`)
    return swap
  }

  swap = new Swap(order.id)

  _swaps.push(swap)

  return swap
}

const requestOrder = (order) => {
  if (order.isMy) return
  if (order.isRequested) return
  if (order.isProcessed) return

  console.log(`requesting order ${order.id}`)

  order.sendRequest(accepted => {
    console.log(`order ${order.id} accepted = ${accepted}`)

    if (accepted) {
      const swap = startSwap({ id: order.id })

      try { swap.flow.sign() } catch (err) {}
      try { swap.flow.submitSecret(SECRET) } catch (err) {}
      // try { swap.flow.verifyBtcScript() } catch (err) {}
    }
  })
}

const acceptRequest = ({ orderId, participant }) => {
  const order = Orders.getByKey(orderId)

  console.log(`accepting order ${order.id}`)

  order.acceptRequest(participant.peer)
}

const startDummy = ({ room, orders }) => {
  Room = Room || room
  Orders = Orders || orders

  Room.on('user online', console.log)
  Room.on('user offline', console.log)

  Orders.on('new order request', acceptRequest)

  Orders.on('new order', requestOrder)

  Orders.on('new orders', orderList => {
    console.log('new orders', orderList.map(o => o.id))
    orderList.map(requestOrder)
  })

  Orders.create(_ORDER_ASK)
  Orders.create(_ORDER_BID)

  setInterval(() => {
    console.log('Orders', Orders.items.map(o => o.id))
    Orders.items
      .filter(o => !o.isRequested)
      .filter(o => !o.isMy)
      .map(requestOrder)
  }, 1000)
}

const stopDummy = () => {
  Room.off('user online')
  Room.off('user offline')

  Orders.off('new order request')
  Orders.off('new order')
  Orders.off('new orders')
}

module.exports = {
  startDummy,
  stopDummy,
}
