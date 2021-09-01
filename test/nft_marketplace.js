const { expect } = require("chai");

let deployer;
let user0;

let TokenContract;
let MarketContract;

let TokenContract2;
let MarketContract2;

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
    TokenContract   = await Token.deploy();
    TokenContract2  = new ethers.Contract(TokenContract.address, TokenContract.interface, user0);
  });

  it("Marketplace deployment", async function () {
    const MarketPlace = await ethers.getContractFactory("NFTMarketPlace");
    MarketContract = await MarketPlace.deploy(TokenContract.address);
    MarketContract2  = new ethers.Contract(MarketContract.address, MarketContract.interface, user0);
  });

  it("Give tokens to other users.", async function() {
    await TokenContract.transfer(user0.address, 100_000_00000);
  });
});

describe("Sell NFT's", function ()
{
  it("Add product to store", async function()
  {
    await MarketContract.sellNFT(100_00000, 3);
    await MarketContract.sellNFT(200_00000, 6);
    await MarketContract.sellNFT(50_00000, 15);
  });

  it("Check if added product data added is correct", async function()
  {
    const product0 = await MarketContract.getVendorProductData(deployer.address, 0);
    const product1 = await MarketContract.getVendorProductData(deployer.address, 1);
    const product2 = await MarketContract.getVendorProductData(deployer.address, 2);

    expect(product0.supply.toNumber()).to.equal(3);
    expect(product1.supply.toNumber()).to.equal(6);
    expect(product2.supply.toNumber()).to.equal(15);

    expect(product0.price.toNumber()).to.equal(100_00000);
    expect(product1.price.toNumber()).to.equal(200_00000);
    expect(product2.price.toNumber()).to.equal(50_00000);
  });
});



describe("Buy NFT's (Pass 0)", function ()
{
  it("Buy products from vendor.", async function()
  {
    await TokenContract2.approve(MarketContract.address, 100_00000 * 2);
    for (let i = 0; i < 2; i++)
      await MarketContract2.buyNFT(deployer.address, 0);

    await TokenContract2.approve(MarketContract.address, 200_00000 * 6);
    for (let i = 0; i < 6; i++)
      await MarketContract2.buyNFT(deployer.address, 1);
  });

  it("Overbuy products from vendor", async function()
  {
    await TokenContract2.approve(MarketContract.address, 200_00000);

    let success = false;
    try {
      await MarketContract2.buyNFT(deployer.address, 1);
      success = true;
    }
    catch (err) {
      success = false;
    }

    expect(success).to.equal(false);
  });
});


describe("Cancel NFT", function ()
{
  it("Cancel NFT Sale", async function()
  {
    await MarketContract.cancelNFTSale(2);
  });

  it("Check if NFT sale cancelled.", async function() {
    const data = await MarketContract.getVendorProductData(deployer.address, 2);
    expect(data.supply.toNumber()).to.equal(0);
  });
});


describe("Test marketplace data (Pass 0)", function ()
{
  it("Check NFT's sold", async function() {
    const NFTsSold0 = (await MarketContract.getVendorProductData(deployer.address, 0)).sold.toNumber();
    const NFTsSold1 = (await MarketContract.getVendorProductData(deployer.address, 1)).sold.toNumber();
    const NFTsSold2 = (await MarketContract.getVendorProductData(deployer.address, 2)).sold.toNumber();

    expect(NFTsSold0).to.equal(2);
    expect(NFTsSold1).to.equal(6);
    expect(NFTsSold2).to.equal(0);
  });

  it("Check NFT's purchased", async function() {

    for (let i = 0; i < 2; i++)
    {
      const NFTPurchased = (await MarketContract.getCustomerPurchaseData(user0.address, i));
      expect(NFTPurchased.NFTId).to.equal(0);
      expect(NFTPurchased.vendor).to.equal(deployer.address);
    }

    for (let i = 2; i < 2 + 6; i++)
    {
      const NFTPurchased = (await MarketContract.getCustomerPurchaseData(user0.address, i));
      expect(NFTPurchased.NFTId).to.equal(1);
      expect(NFTPurchased.vendor).to.equal(deployer.address);
    }
  });
});

describe("Test ERC20 data (Pass 0)", function ()
{
  it("Test ERC20 tokens data after all purchases.", async function()
  {
    const initialCustomerTokens = 100_000_00000;
    const initialVendorTokens   = 100_000_000_00000 - initialCustomerTokens;

    const totalSpent        = 100_00000 * 2 + 200_00000 * 6;
    const balanceCustomer   = (await TokenContract.balanceOf(user0.address)).toNumber();
    const balanaceVendor    = (await TokenContract.balanceOf(deployer.address)).toNumber();

    expect(balanaceVendor).to.equal(initialVendorTokens + totalSpent);
  });
});

describe("Buy NFT (pass 1)", function ()
{
  it("Try buying cancelled product.", async function()
  {
    let success = false;
    try {
      await MarketContract2.buyNFT(deployer.address, 2);
      success = true;
    }
    catch (err) {
      success = false;
    }

    expect(success).to.equal(false);
  });

  it("Buy another NFT.", async function()
  {
    await TokenContract2.approve(MarketContract.address, 100_00000 * 1);
    for (let i = 0; i < 1; i++)
      await MarketContract2.buyNFT(deployer.address, 0);
  });
});


describe("Test ERC20 data (Pass 1)", function ()
{
  it("Test ERC20 tokens data after all purchases.", async function()
  {
    const initialCustomerTokens = 100_000_00000;
    const initialVendorTokens   = 100_000_000_00000 - initialCustomerTokens;

    const totalSpent        = 100_00000 * 3 + 200_00000 * 6;
    const balanceCustomer   = (await TokenContract.balanceOf(user0.address)).toNumber();
    const balanaceVendor    = (await TokenContract.balanceOf(deployer.address)).toNumber();

    expect(balanaceVendor).to.equal(initialVendorTokens + totalSpent);
  });
});

describe("Test marketplace data (Pass 1)", function ()
{
  it("Check NFT's sold", async function() {
    const NFTsSold0 = (await MarketContract.getVendorProductData(deployer.address, 0)).sold.toNumber();
    const NFTsSold1 = (await MarketContract.getVendorProductData(deployer.address, 1)).sold.toNumber();
    const NFTsSold2 = (await MarketContract.getVendorProductData(deployer.address, 2)).sold.toNumber();

    expect(NFTsSold0).to.equal(3);
    expect(NFTsSold1).to.equal(6);
    expect(NFTsSold2).to.equal(0);
  });

  it("Check NFT's purchased", async function() {

    for (let i = 0; i < 2; i++)
    {
      const NFTPurchased = (await MarketContract.getCustomerPurchaseData(user0.address, i));
      expect(NFTPurchased.NFTId).to.equal(0);
      expect(NFTPurchased.vendor).to.equal(deployer.address);
    }

    for (let i = 2; i < 2 + 6; i++)
    {
      const NFTPurchased = (await MarketContract.getCustomerPurchaseData(user0.address, i));
      expect(NFTPurchased.NFTId).to.equal(1);
      expect(NFTPurchased.vendor).to.equal(deployer.address);
    }

    for (let i = 2 + 6; i < 2 + 6 + 1; i++)
    {
      const NFTPurchased = (await MarketContract.getCustomerPurchaseData(user0.address, i));
      expect(NFTPurchased.NFTId).to.equal(0);
      expect(NFTPurchased.vendor).to.equal(deployer.address);
    }
  });
});


describe("Test Other Untested Functions", function ()
{
  it("Customer count", async function() {
    const customerCount = (await MarketContract.getCustomerCount()).toNumber();
    expect(customerCount).to.equal(1);
  });

  it("Vendor Count", async function() {
    const customerCount = (await MarketContract.getVendorCount()).toNumber();
    expect(customerCount).to.equal(1);
  });


  it("Customer Purchase Count", async function() {
    const customerCount = (await MarketContract.getCustomerPurchaseCount(user0.address)).toNumber();
    expect(customerCount).to.equal(1 + 2 + 6);
  });

  it("Vendor Product Count", async function() {
    const customerCount = (await MarketContract.getVendorProductCount(deployer.address)).toNumber();
    expect(customerCount).to.equal(3);
  });

  it("Vendor Product Data", async function() {
    const product0 = (await MarketContract.getVendorProductData(deployer.address, 0));
    const product1 = (await MarketContract.getVendorProductData(deployer.address, 1));
    const product2 = (await MarketContract.getVendorProductData(deployer.address, 2));

    expect(product0.supply.toNumber()).to.equal(3);
    expect(product1.supply.toNumber()).to.equal(6);
    expect(product2.supply.toNumber()).to.equal(0);

    expect(product0.price.toNumber()).to.equal(100_00000);
    expect(product1.price.toNumber()).to.equal(200_00000);
    expect(product2.price.toNumber()).to.equal(50_00000);
  });

  it("Currency", async function() {
    const currency = await MarketContract.getCurrency();
    expect(currency).to.equal(TokenContract.address);
  });

  it("Release accidentally stored tokens to market address", async function() {
    const currentTokensHeld = await TokenContract.balanceOf(deployer.address);
    TokenContract.transfer(MarketContract.address, 99_000);

    const tokensAfterTransfer = await TokenContract.balanceOf(deployer.address);
    expect(tokensAfterTransfer).to.equal(currentTokensHeld - 99_000);

    await MarketContract.releaseTokens(TokenContract.address);

    const tokensAfterRelease = await TokenContract.balanceOf(deployer.address);
    expect(tokensAfterRelease).to.equal(currentTokensHeld);
  });
});


