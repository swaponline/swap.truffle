pragma solidity ^0.4.23;

import './Reputation.sol';
import './SafeMath.sol';
import './Interfaces.sol';

contract EthTokenToSmthSwaps {

  using SafeMath for uint;
  
  address public owner;
  address public ratingContractAddress;
  uint256 SafeTime = 4 seconds; // atomic swap timeOut

  struct Swap {
    address token;
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

  // ETH Owner creates Swap with secretHash
  // ETH Owner make token deposit
  function createSwap(bytes20 _secretHash, address _participantAddress, uint256 _value, address _token) public {
    require(_value > 0);
    require(swaps[msg.sender][_participantAddress].balance == uint256(0));
    require(ERC20(_token).transferFrom(msg.sender, this, _value));

    swaps[msg.sender][_participantAddress] = Swap(
      _token,
      bytes32(0),
      _secretHash,
      now,
      _value
    );
  }

  function getInfo(address _ownerAddress, address _participantAddress) public view returns (address, bytes32,  bytes20,  uint256,  uint256) {
    Swap memory swap = swaps[_ownerAddress][_participantAddress];

    return (swap.token, swap.secret, swap.secretHash, swap.createdAt, swap.balance);
  }

  // BTC Owner withdraw money and adds secret key to swap
  // BTC Owner receive +1 reputation
  function withdraw(bytes32 _secret, address _ownerAddress) public {
    Swap memory swap = swaps[_ownerAddress][msg.sender];
    
    require(swap.secretHash == ripemd160(_secret));
    require(swap.balance > uint256(0));
    require(swap.createdAt.add(SafeTime) > now);

    swaps[_ownerAddress][msg.sender].secret = _secret;
    Reputation(ratingContractAddress).change(msg.sender, 1);
    ERC20(swap.token).transfer(msg.sender, swap.balance);
  }

  // ETH Owner receive secret
  function getSecret(address _participantAddress) public view returns (bytes32) {
    return swaps[msg.sender][_participantAddress].secret;
  }
  
  // ETH Owner closes swap
  // ETH Owner receive +1 reputation
  function close(address _participantAddress) public {
    Reputation(ratingContractAddress).change(msg.sender, 1);
    clean(msg.sender, _participantAddress);
  }

  // ETH Owner refund money
  // BTC Owner gets -1 reputation
  function refund(address _participantAddress, bytes _sign) public {
    Swap memory swap = swaps[msg.sender][_participantAddress];
    require(_participantAddress == checkSingature(msg.sender,  swap.secretHash,  swap.createdAt,  _sign));
    require(swap.createdAt.add(SafeTime) < now);
    
    ERC20(swap.token).transfer(msg.sender, swap.balance);
    // TODO it looks like ETH Owner can create as many swaps as possible and refund them to decrease someone reputation
    Reputation(ratingContractAddress).change(_participantAddress, -1);
    clean(msg.sender, _participantAddress);
  }

  // BTC Owner closes Swap
  // If ETH Owner don't create swap after init in in safeTime
  // ETH Owner -1 reputation
  function abort(address _ownerAddress, bytes20 _secretHash,  uint256 _createdAt, bytes _sign) public {
    Swap memory swap = swaps[_ownerAddress][msg.sender];
    require(swap.balance == uint256(0));
    require(_ownerAddress == checkSingature(msg.sender,  _secretHash,  _createdAt,  _sign));
    
    Reputation(ratingContractAddress).change(_ownerAddress, -1);
    clean(_ownerAddress, msg.sender);
  }

  function unsafeGetSecret(address _ownerAddress, address _participantAddress) public view returns (bytes32) {
    return swaps[_ownerAddress][_participantAddress].secret;
  }

  function clean(address _ownerAddress, address _participantAddress) internal {
    delete swaps[_ownerAddress][_participantAddress];

  }

  function checkSingature(address _participant, bytes20 _secretHash, uint _startTime, bytes _sign) public pure returns(address _signer) {
    bytes32 _hash = keccak256(abi.encodePacked(_participant, _secretHash, _startTime));
    _signer = recoverSigner(_hash, _sign);
  }

  function recoverSigner(bytes32 _hash, bytes signature) internal pure returns(address) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        (r, s, v) = signatureSplit(signature);
        return ecrecover(_hash, v, r, s);
  }

  function signatureSplit(bytes signature) internal pure returns(bytes32 r, bytes32 s, uint8 v) {
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := and(mload(add(signature, 65)), 0xff)
        }
        require(v == 27 || v == 28);
  }
}
