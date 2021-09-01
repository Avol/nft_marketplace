require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: {
		compilers: [
			{
        			version: "0.6.6",
			},
			{
        			version: "0.8.0",
			},
		]
      	},
	//defaultNetwork: "localhost",
	networks: {
		localhost: {
		  url: "http://127.0.0.1:8545/"
		},
		hardhat: {
		},
		rinkeby: {
		  url: "https://eth-mainnet.alchemyapi.io/v2/123abc123abc123abc123abc123abcde"
		}
	},
mocha: {
    timeout: 10000000
  }
};
