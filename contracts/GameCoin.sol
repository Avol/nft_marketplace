// contracts/GameCoin.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameCoin is ERC20 {
    constructor() ERC20("Game Coin", "GAME") {
        _mint(msg.sender, 100_000_000e5);
    }

    function decimals() public view virtual override returns (uint8) {
        return 5;
    }
}