pragma solidity ^0.5.10;

contract Bank {
    struct User {
        bool isExist;
        uint256 balance;
    }

    mapping (address => User) ledger;

    function addUser() public {
        address sender = msg.sender;
        User memory user = User(true, 0);
        ledger[sender] = user;
    }

    function saveMoney(uint256 money) public {
        address sender = msg.sender;
        require(ledger[sender].isExist, "The transaction is not allowed.");
        ledger[sender].balance += money;
    }

    function getBalance() public view returns (uint256) {
        address sender = msg.sender;
        require(ledger[sender].isExist, "The transaction is not allowed.");
        return ledger[sender].balance;
    }
}