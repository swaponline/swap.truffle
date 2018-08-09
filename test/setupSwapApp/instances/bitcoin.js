const bitcoin = require('bitcoinjs-lib')
const request = require('request-promise-native')
const BigNumber = require('bignumber.js')

// const BITPAY = isMain ? `https://insight.bitpay.com/api` : `https://test-insight.bitpay.com/api`
const BITPAY = false ? `https://insight.bitpay.com/api` : `https://testnet.y000r.world/insight-api`

const filterError = ({ name, code, statusCode, options }) => {
  if (name == 'StatusCodeError' && statusCode == 525)
    console.error(`BITPAY refuse:`, options.method, options.uri)
  else
    console.error(code, name, statusCode, options)
}

class Bitcoin {

  constructor(_network) {
    this.core = bitcoin

    this.net = bitcoin.networks[_network === 'mainnet' ? 'bitcoin' : 'testnet']
  }

  getRate() {
    return new Promise((resolve) => {
      request.get('https://noxonfund.com/curs.php')
        .then(({ price_btc }) => {
          resolve(price_btc)
        })
    })
  }

  login(_privateKey) {
    let privateKey = _privateKey

    if (!privateKey) {
      const keyPair = this.core.ECPair.makeRandom({ network: this.net })
      privateKey    = keyPair.toWIF()
    }

    const account     = new this.core.ECPair.fromWIF(privateKey, this.net)
    const address     = account.getAddress()
    const publicKey   = account.getPublicKeyBuffer().toString('hex')

    account.__proto__.getPrivateKey = () => privateKey

    console.info('Logged in with Bitcoin', {
      account,
      address,
      privateKey,
      publicKey,
    })

    return account
  }

  fetchBalance(address) {
    return request.get(`${BITPAY}/addr/${address}`)
      .then(( json ) => {
        const balance = JSON.parse(json).balance
        console.log('BTC Balance:', balance)

        return balance
      })
      .catch(error => filterError(error))
  }

  fetchUnspents(address) {
    return request
      .get(`${BITPAY}/addr/${address}/utxo`)
      .then(json => JSON.parse(json))
      .catch(error => filterError(error))
  }

  broadcastTx(txRaw) {
    return request.post(`${BITPAY}/tx/send`, {
      json: true,
      body: {
        rawtx: txRaw,
      },
    })
    .catch(error => filterError(error))
  }

  async sendTransaction({ account, to, value }, handleTransactionHash) {
    const tx = new bitcoin.TransactionBuilder(this.net)

    value = BigNumber(value)

    const unspents      = await this.fetchUnspents(account.getAddress())

    const fundValue     = value.multipliedBy(1e8).integerValue().toNumber()
    const feeValue      = 1000
    const totalUnspent  = unspents.reduce((summ, { satoshis }) => summ + satoshis, 0)
    const skipValue     = totalUnspent - fundValue - feeValue

    if (totalUnspent < feeValue + fundValue) {
      throw new Error(`Total less than fee: ${totalUnspent} < ${feeValue} + ${fundValue}`)
    }

    unspents.forEach(({ txid, vout }) => tx.addInput(txid, vout, 0xfffffffe))
    tx.addOutput(to, fundValue)

    if (skipValue)
      tx.addOutput(account.getAddress(), skipValue)

    tx.inputs.forEach((input, index) => {
      tx.sign(index, account)
    })

    const txRaw = tx.buildIncomplete()

    if (typeof handleTransactionHash === 'function') {
      handleTransactionHash(txRaw.getId())
      console.log('tx id', txRaw.getId())
    }

    console.log('raw tx = ', txRaw.toHex())

    const result = await this.broadcastTx(txRaw.toHex())

    return result
  }
}

module.exports = new Bitcoin()
module.exports.mainnet = () => new Bitcoin('mainnet')
module.exports.testnet = () => new Bitcoin('testnet')
module.exports.localnet = () => new Bitcoin('testnet')
