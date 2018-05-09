pragma solidity ^0.4.23;

contract Rating2 {

  // owner - EthToBtcSwaps Contract
  address owner;
  mapping(address => int) ratings;

  constructor (address _ownerAddress) public {
    owner = _ownerAddress;
  }

  function change(address _userAddress, int _delta) public {
    require(msg.sender == owner);
    ratings[_userAddress] += _delta;
  }

  function getMy() public view returns (int) {
    return ratings[msg.sender];
  }

  function get(address _userAddress) public view returns (int) {
    return ratings[_userAddress];
  }
}