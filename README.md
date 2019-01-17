# swap.truffle

Вынесли отдельно тесты в локальный трюфле, чтоб легче было отлаживать. Пока без офчейна, но можно тестировать без деплоя в ринки, чтоб не ждать пока зафейлится транза

Тест кейсы:
0. Все прошло хорошо
1. Что делать если Алиса не заморозила биткоин? Боб должен (если хочет) заморозить токен и сделать рефанд.
2. Что делать если Боб не заморозил токен? Алиса выполняет close (после таймаута подписи. таймаут подписи не сделали)
3. Что делать если алиса не забрала токен? Боб делает рефанд после таймаута и минусует алису.

## Global

```sh
npm i -g truffle
```

## Install

```sh
git clone https://github.com/swaponline/swap.truffle.git
cd ./swap.truffle
npm i
```


## Test

```sh
truffle develop
truffle(develop)> test
```

## Etherscan Verify

1. Run tests
```bash
truffle test
```
2. Deploy contract and save deployed address
```bash
truffle deploy --network rinkeby # (or mainnet)
```
3. Flatten imports:
```bash
pip3 install solidity_flattener
# install solc
npm run flatten -- contracts/[ContractName].sol
# will be saved to build/flattened.sol
```

4. Prepare needed variables:
```bash
# export NETWORK=mainnet # optional
export CONTRACT_ADDRESS=0xABCc0n7rac7
export CONTRACT_NAME=EthToSmthSwaps
export ETHERSCAN_API_KEY=[your api key]
```
5. Run verificator!
```bash
node verify.js $CONTRACT_ADDRESS build/flattened.sol
```
6. If there are errors, look into params.

### todo:

```md
- [x] больше проверок в тестах
- [x] заполнить truffle.js
- [x] code review
```
