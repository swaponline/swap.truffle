pragma solidity ^0.4.23;

import './SafeMath.sol';

contract EthToSmthSwaps {

  using SafeMath for uint;

  address public owner;
  address public ratingContractAddress;
  uint256 SafeTime = 3 hours; // atomic swap timeOut

  struct Swap {
    bytes32 secret;
    bytes20 secretHash;
    uint256 createdAt;
    uint256 balance;
  }

  // ETH Owner => BTC Owner => Swap
  mapping(address => mapping(address => Swap)) public swaps;

  constructor () public {
    owner = msg.sender;
  }

  function setReputationAddress(address _ratingContractAddress) public {
    require(owner == msg.sender);
    ratingContractAddress = _ratingContractAddress;
  }

  event Sign();

  // ETH Owner signs swap
  // initializing time for correct work of close() method
  function sign(address _participantAddress) public {
    require(swaps[msg.sender][_participantAddress].balance == 0);

    emit Sign();
  }

  // BTC Owner checks if ETH Owner signed swap
  function checkSign() public view returns (uint) {
    return now;
  }

  event CreateSwap(uint256 createdAt);

  // ETH Owner creates Swap with secretHash
  // ETH Owner make token deposit
  function createSwap(bytes20 _secretHash, address _participantAddress) public payable {
    require(msg.value > 0);
    require(swaps[msg.sender][_participantAddress].balance == uint256(0));

    swaps[msg.sender][_participantAddress] = Swap(
      bytes32(0),
      _secretHash,
      now,
      msg.value
    );

    emit CreateSwap(now);
  }

  // BTC Owner receive balance
  function getBalance(address _ownerAddress) public view returns (uint256) {
    return swaps[_ownerAddress][msg.sender].balance;
  }

  event Withdraw();

  // BTC Owner withdraw money and adds secret key to swap
  // BTC Owner receive +1 reputation
  function withdraw(bytes32 _secret, address _ownerAddress) public {
    Swap memory swap = swaps[_ownerAddress][msg.sender];

    require(swap.secretHash == ripemd160(_secret));
    require(swap.balance > uint256(0));
    require(swap.createdAt.add(SafeTime) > now);

    msg.sender.transfer(swap.balance);

    swaps[_ownerAddress][msg.sender].balance = 0;
    swaps[_ownerAddress][msg.sender].secret = _secret;

    emit Withdraw();
  }

  // ETH Owner receive secret
  function getSecret(address _participantAddress) public view returns (bytes32) {
    return swaps[msg.sender][_participantAddress].secret;
  }

  event Close();

  // ETH Owner closes swap
  // ETH Owner receive +1 reputation
  function close(address _participantAddress) public {
    require(swaps[msg.sender][_participantAddress].balance == 0);

    clean(msg.sender, _participantAddress);

    emit Close();
  }

  event Refund();

  // ETH Owner refund money
  // BTC Owner gets -1 reputation
  function refund(address _participantAddress) public {
    Swap memory swap = swaps[msg.sender][_participantAddress];

    require(swap.balance > uint256(0));
    require(swap.createdAt.add(SafeTime) < now);

    msg.sender.transfer(swap.balance);
    // TODO it looks like ETH Owner can create as many swaps as possible and refund them to decrease someone reputation
    clean(msg.sender, _participantAddress);

    emit Refund();
  }

  event Abort();

  // BTC Owner closes Swap
  // If ETH Owner don't create swap after init in in safeTime
  // ETH Owner -1 reputation
  function abort(address _ownerAddress) public {
    require(swaps[_ownerAddress][msg.sender].balance == uint256(0));

    clean(_ownerAddress, msg.sender);

    emit Abort();
  }

  function clean(address _ownerAddress, address _participantAddress) internal {
    delete swaps[_ownerAddress][_participantAddress];
  }
}
