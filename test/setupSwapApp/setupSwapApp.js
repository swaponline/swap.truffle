const swap = require('swap.core')

const configFactory = require('./config')

exports = module.exports = ({ network, ...settings }) => {
  const getConfig = configFactory[network]

  const config = getConfig(settings)

  swap.app.setup({ contracts: {}, ...config })

  return swap.app
}
