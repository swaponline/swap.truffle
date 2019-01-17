const request = require('request-promise-native')
const fs = require('fs')

const contractAddress = process.argv[2]
const contractPath = process.argv[3]
const contractName = process.env.CONTRACT_NAME || 'EthToSmthSwaps'

if (!contractAddress || !contractPath || contractAddress === '-h') {
  console.log(`
    Usage: node verify.js 0xc07rac7adde55 path/to/contract.sol
  `)

  process.exit(-1)
}

console.log('Verify contract')
console.log('   ADDRESS =', contractAddress)
console.log('   PATH =', contractPath)

const raw_source_code = fs.readFileSync(contractPath, 'utf8')

console.log('   CODE PREVIEW:')
const lines = raw_source_code.split("\n")
console.log('     ', lines.shift())
console.log('     ', lines.shift())
console.log('     ', lines.shift())
console.log('     ', lines.shift())
console.log('     ', lines.shift())
console.log('     ', '...')

const API_KEY = process.env.ETHERSCAN_API_KEY

if (!API_KEY) {
  console.error(`
Error: Required 'ETHERSCAN_API_KEY'.

You need to set you key as an environment variable, e.g.

    ETHERSCAN_API_KEY=... node verify.js

You can learn how to get a key at https://etherscancom.freshdesk.com/support/solutions/articles/35000022163-i-need-an-api-key
  `)
  process.exit(-1)
}

const URL = process.env.NETWORK === 'mainnet'
  ? `https://api.etherscan.io/api`
  : `https://rinkeby.etherscan.io/api`

// Reference: https://etherscan.io/apis#contracts

//
// type: "POST",                       //Only POST supported
//     url: "//api.etherscan.io/api", //Set to the  correct API url for Other Networks
//     data: {
//         apikey: $('#apikey').val(),                     //A valid API-Key is required
//         module: 'contract',                             //Do not change
//         action: 'verifysourcecode',                     //Do not change
//         contractaddress: $('#contractaddress').val(),   //Contract Address starts with 0x...
//         sourceCode: $('#sourceCode').val(),             //Contract Source Code (Flattened if necessary)
//         contractname: $('#contractname').val(),         //ContractName
//         compilerversion: $('#compilerversion').val(),   // see http://etherscan.io/solcversions for list of support versions
//         optimizationUsed: $('#optimizationUsed').val(), //0 = Optimization used, 1 = No Optimization
//         runs: 200,                                      //set to 200 as default unless otherwise
//         constructorArguements: $('#constructorArguements').val(),   //if applicable
//         libraryname1: $('#libraryname1').val(),         //if applicable, a matching pair with libraryaddress1 required
//         libraryaddress1: $('#libraryaddress1').val(),   //if applicable, a matching pair with libraryname1 required
//         libraryname2: $('#libraryname2').val(),         //if applicable, matching pair required
//         libraryaddress2: $('#libraryaddress2').val(),   //if applicable, matching pair required
//         libraryname3: $('#libraryname3').val(),         //if applicable, matching pair required
//         libraryaddress3: $('#libraryaddress3').val(),   //if applicable, matching pair required
//         libraryname4: $('#libra

request
  .post({
    method: 'POST',
    url: `${URL}`,
    form: {
      apikey: API_KEY,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode: raw_source_code,
      contractname: contractName,
      compilerversion: 'v0.5.0+commit.1d4f565a',
      optimizationUsed: '1',
      runs: 200,
      // constructorArguements: '',
    },

  })
  .then(console.log)
  .catch(err => console.error(err.message))
