pragma solidity ^0.4.23;

contract Rating {

  address owner;
  mapping(address => int) whitelist;
  mapping(address => int) ratings;

  constructor () public {
    owner = msg.sender;
  }

  function addToWhitelist(address _contractAddress) public {
    require(msg.sender == owner);
    whitelist[_contractAddress] = 1;
  }

  function change(address _userAddress, int _delta) public {
    require(whitelist[msg.sender] == 1);
    ratings[_userAddress] += _delta;
  }

  function getMy() public view returns (int) {
    return ratings[msg.sender];
  }

  function get(address _userAddress) public view returns (int) {
    return ratings[_userAddress];
  }
}
