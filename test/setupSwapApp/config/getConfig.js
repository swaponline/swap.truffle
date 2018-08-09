const swap = require('swap.core')
const constants = swap.constants

const SwapAuth = swap.auth
const SwapRoom = swap.room
const SwapOrders = swap.orders

const { EthSwap, EthTokenSwap, BtcSwap } = swap.swaps
const { ETH2BTC, BTC2ETH, ETHTOKEN2BTC, BTC2ETHTOKEN } = swap.flows

const web3 = require('../instances/ethereum').core
const bitcoin = require('../instances/bitcoin').core

const Ipfs = require('ipfs')
const IpfsRoom = require('ipfs-pubsub-room')

const common = require('./common')
const { LocalStorage } = require('node-localstorage')

module.exports = (config) => ({ account, contracts: { ETH, TOKEN } }) => {
  config = {
    ...common,
    ...config,

    swapRoom: {
      ...common.swapRoom,
      ...config.swapRoom,
    },
  }

  return {
    network: config.network,
    env: {
      web3,
      bitcoin,
      Ipfs,
      IpfsRoom,
      storage: new LocalStorage(config.storageDir),
    },
    services: [
      new SwapAuth({
        eth: account,
        btc: null,
      }),
      new SwapRoom(config.swapRoom),
      new SwapOrders(),
    ],

    swaps: [
      new EthSwap(config.ethSwap(ETH)),
      new BtcSwap(config.btcSwap()),
      new EthTokenSwap(config.noxonTokenSwap(TOKEN)),
      new EthTokenSwap(config.swapTokenSwap(TOKEN)),
    ],

    flows: [
      ETH2BTC,
      BTC2ETH,
      ETHTOKEN2BTC(constants.COINS.noxon),
      BTC2ETHTOKEN(constants.COINS.noxon),
      ETHTOKEN2BTC(constants.COINS.swap),
      BTC2ETHTOKEN(constants.COINS.swap),
    ],
  }
}
