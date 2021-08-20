const { expect } = require("chai");

let deployer;
let user0;

let TokenContract;
let NFTContract;
let MarketContract;

// --------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------- Tests -----------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------

describe("Create Contracts & NFTs", function ()
{
  it("Get Signers", async function() {
    [deployer, user0] = await ethers.getSigners();
  });

  it("ERC20 token deployment", async function() {
    const Token = await ethers.getContractFactory("GameCoin");
    TokenContract = await Token.deploy();
  });

  it("ERC721 token deployment", async function() {
    const NFT = await ethers.getContractFactory("GameNFT");
    NFTContract = await NFT.deploy("GameNFT", "GNFT", "https://gamestarter.co/NFTs/");
  });

  it("ERC721 marketplace deployment", async function () {
    const MarketPlace = await ethers.getContractFactory("GameNFTMarketPlace");
    MarketContract = await MarketPlace.deploy(TokenContract.address);
  });

  it("Mint some NFTs", async function() {
    for (let i = 0; i < 10; i++)
      await NFTContract.mint(deployer.address);
  });

  it("Give tokens to other users.", async function() {
    await TokenContract.transfer(user0.address, 100_000_00000);
  });
});

describe("Become a seller", function ()
{
  it("Add products to marketplace", async function()
  {
    // TODO: test single token permision.
    // give permissions to use all tokens.
    await NFTContract.setApprovalForAll(MarketContract.address, true);

    // add NFT to marketplace.
    await MarketContract.addProduct(NFTContract.address, 0, 100_00000);
  });

  it("Check if Owners of NFT correct after adding product.", async function()
  {
    const marketOwnedTokens = (await NFTContract.balanceOf(MarketContract.address)).toNumber();
    expect(marketOwnedTokens).to.equal(1);

    const indexOfNFT = (await NFTContract.tokenOfOwnerByIndex(MarketContract.address, 0)).toNumber();
    expect(indexOfNFT).to.equal(0);
  });



  it("Buy product from marketplace.", async function()
  {
    // random user providers
    const rndUserMarketContract = new ethers.Contract(MarketContract.address, MarketContract.interface, user0);
    const rndUserTokenContract  = new ethers.Contract(TokenContract.address, TokenContract.interface, user0);

    // set allowance.
    await rndUserTokenContract.increaseAllowance(MarketContract.address, 100_000_000_00000);

    // buy product
    await rndUserMarketContract.buyProduct(deployer.address, 0);
  });

  it("Check if Owners of NFT correct after buying product", async function()
  {
    const marketOwnedTokens = (await NFTContract.balanceOf(MarketContract.address)).toNumber();
    expect(marketOwnedTokens).to.equal(0);
  });
});