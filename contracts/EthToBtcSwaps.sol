pragma solidity ^0.4.17;

import './Rating.sol';
import './SafeMath.sol';
import './Interfaces.sol';

contract EthToBtcSwaps {

  using SafeMath for uint;
  
  address public owner;
  address public ratingContractAddress;
  // atomic swap timeOut
  // 10 second for debug
  uint256 SafeTime = 10 seconds;
  enum statuses {NaN, opened}

  struct Swap {
    statuses status;
    address initiator;
    address participant;
    bytes32 secret;
    bytes20 secretHash;
    uint256 initTime;
    uint256 balance;
    address token;
  }

  // ETH Owner => BTC Owner => Swap
  mapping(address => mapping(address => Swap)) public swaps;
  mapping(address => mapping(address => uint)) public signs;

  constructor () public {
    owner = msg.sender;
  }

  function setRatingAddress(address _ratingContractAddress) public {
    require(owner == msg.sender);
    ratingContractAddress = _ratingContractAddress;
  }

  // ETH Owner init swap
  function initSwap(address _participantAddress) public {
    // добавленно время инициализации для коректонной работы метода close()
    signs[msg.sender][_participantAddress] = now;
  }

  // ETH Owner creates Swap with secretHash
  // ETH Owner make token deposit
  function createSwap(bytes20 _secretHash, address _participantAddress, uint256 _value, address _token) public {
    require(signs[msg.sender][_participantAddress].add(SafeTime) > now);
    require(swaps[msg.sender][_participantAddress].status == statuses.NaN);
    require(_value > 0);
    require(ERC20(_token).transferFrom(msg.sender, this, _value));
    swaps[msg.sender][_participantAddress] = Swap(
      statuses.opened,
      msg.sender,
      _participantAddress,
      bytes32(0),
      _secretHash,
      now,
      _value,
      _token
    );
  }

  // BTC Owner sent secret and refund funds
  // ETH Owner gets +1 reputation
  function withdraw(bytes32 _secret, address _ownerAddress) public {
    
    Swap memory swap = swaps[_ownerAddress][msg.sender];
    
    require(swap.secretHash == ripemd160(_secret));
    
    require(swap.status == statuses.opened);
    require(swap.initTime.add(SafeTime) > now);
    
    
    ERC20(swap.token).transfer(swap.participant, swap.balance);
    Rating(ratingContractAddress).change(swap.participant, 1);
    clean(_ownerAddress, msg.sender);

  }

  // ETH Owner refund money
  // BTC Owner gets -1 reputation
  function refund(address _participantAddress) public {
    
    Swap memory swap = swaps[msg.sender][_participantAddress];
    
    require(swap.status == statuses.opened);
    require(swap.initTime.add(SafeTime) < now);
    
    ERC20(swap.token).transfer(swap.initiator, swap.balance);
    Rating(ratingContractAddress).change(_participantAddress, -1);
    clean(swap.initiator, _participantAddress);

  }

  // If ETH Owner don't create swap after init in in safeTime
  // ETH Owner -1 reputation
  function close(address _ownerAddress) public {
    
    require(signs[_ownerAddress][msg.sender] != uint(0));
    
    require(signs[_ownerAddress][msg.sender].add(SafeTime) < now);
    require(swaps[_ownerAddress][msg.sender].status == statuses.NaN);
    
    Rating(ratingContractAddress).change(_ownerAddress, -1);
    clean(_ownerAddress, msg.sender);
  }

  function getInfo(address _ownerAddress, address _participantAddress) public view returns (statuses, bytes32,  bytes20,  uint256,  uint256, address) {
    Swap memory swap = swaps[_ownerAddress][_participantAddress];
    return (swap.status, swap.secret, swap.secretHash, swap.initTime, swap.balance, swap.token);
  }

  function getSecret(address _participantAddress) public view returns (bytes32) {
    return swaps[msg.sender][_participantAddress].secret;
  }

  function unsafeGetSecret(address _ownerAddress, address _participantAddress) public view returns (bytes32) {
    return swaps[_ownerAddress][_participantAddress].secret;
  }

  function clean(address _ownerAddress, address _participantAddress) internal {
    delete swaps[_ownerAddress][_participantAddress];
    delete signs[_ownerAddress][_participantAddress];
  }
}