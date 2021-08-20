// contracts/GameNFTMarketPlace.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

struct Product
{
    IERC721         NFTContract;           // nft smart contract.
    uint256         NFTId;              // nft id.
    uint256         price;              // price in game coin.
    bool            available;          // is product available to buy. (can be sold or removed).
}

contract GameNFTMarketPlace is ERC721Holder
{
    using SafeERC20 for IERC20;

    IERC20  private immutable   _currency;

    mapping(address => mapping(uint256 => Product))     private _vendors;               // list of sellers and their products.
    mapping(address => uint256)                         private _vendorProductCount;    // amount of products held by vendor.

    constructor(
        IERC20 currency_
    ) {
        _currency              = currency_;
    }

    /**
     * @notice
     *              NFTContract_               - IERC721 contract address.
     *              NFTId_                     - ID of NFT within NFT contract.
     *              price_                     - price of NFT in ERC20 currency.
     */
    function addProduct(IERC721 NFTContract_, uint256 NFTId_, uint256 price_) external
    {
        // check owner of NFT.
        require(NFTContract_.ownerOf(NFTId_) == msg.sender, "Permissions Error: not an owner of NFT.");

        // store product
        uint256 productCount = _vendorProductCount[msg.sender];
        _vendors[msg.sender][productCount].NFTContract     = NFTContract_;
        _vendors[msg.sender][productCount].NFTId        = NFTId_;
        _vendors[msg.sender][productCount].price        = price_;
        _vendors[msg.sender][productCount].available    = false;
        _vendorProductCount[msg.sender]++;

        // transfer NFT to this contract.
        NFTContract_.safeTransferFrom(msg.sender, address(this), NFTId_);

        _vendors[msg.sender][productCount].available    = true;
    }

    /**
     * @notice
     *          productID_       - NFT id to return.
     */
    function removeProduct(uint256 productID_)  external
    {
        // check if vendor has any NFTs
        require(_vendorProductCount[msg.sender] != 0, "Vendor doesn't have any NFTs to remove.");

        // check if vendor has NFT.
        require(productID_ >= 0 && productID_ < _vendorProductCount[msg.sender], "Vendor doesn't have NFT with this ID.");

        // mark NFT as returned.
        _vendors[msg.sender][productID_].available = false;

        // transfer NFT from marketplace back to vendor.
        IERC721     NFTContract    = _vendors[address(this)][productID_].NFTContract;
        NFTContract.safeTransferFrom(address(this), msg.sender, productID_);
    }

    /**
     * @notice
     *          vendor_          - vendor address.
     *          productID_       - NFT id to return.
     */
    function buyProduct(address vendor_, uint256 productID_) external
    {
        // check if vendor has any NFTs
        require(_vendorProductCount[vendor_] != 0, "Vendor doesn't have any NFTs to sell.");

        // check if vendor has NFT.
        require(productID_ >= 0 && productID_ < _vendorProductCount[vendor_], "Vendor doesn't have NFT with this ID.");

        // check if product is for sale.
        require(_vendors[vendor_][productID_].available == true, "Cannot buy this product.");

        // get NFT price.
        uint256     price       = _vendors[vendor_][productID_].price;

        // check if buyer has enough ERC20 token to buy this NFT.
        require(_currency.balanceOf(msg.sender) >= price, "Not enough ERC20 token to buy this NFT");

        // get token address & id.
        IERC721     NFTContract    = _vendors[vendor_][productID_].NFTContract;
        uint256     NFTId          = _vendors[vendor_][productID_].NFTId;

        // finalize transfer.
        NFTContract.safeTransferFrom(address(this), msg.sender, NFTId);
        _currency.transferFrom(msg.sender, vendor_, price);
    }

    /**
     * @notice  returns NFT contract address
     *          vendor_          - vendor address.
     *          productID_       - NFT id to return.
     */
    function getNFTContract(address vendor_, uint256 productID_) external view returns (IERC721)
    {
        return _vendors[vendor_][productID_].NFTContract;
    }

    /**
     * @notice  returns NFT id in NFT contract.
     *          vendor_          - vendor address.
     *          productID_       - NFT id to return.
     */
    function getNFTId(address vendor_, uint256 productID_) external view returns (uint256)
    {
        return _vendors[vendor_][productID_].NFTId;
    }

    /**
     * @notice  returns NFT price in marketplace.
     *          vendor_          - vendor address.
     *          productID_       - NFT id to return.
     */
    function getNFTPrice(address vendor_, uint256 productID_) external view returns (uint256)
    {
        return _vendors[vendor_][productID_].price;
    }

    /**
     * @notice  returns NFT is NFT for sale.
     *          vendor_          - vendor address.
     *          productID_       - NFT id to return.
     */
    function getNFTAvailable(address vendor_, uint256 productID_) external view returns (bool)
    {
        return _vendors[vendor_][productID_].available;
    }
}