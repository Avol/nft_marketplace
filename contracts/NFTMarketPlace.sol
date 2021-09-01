// contracts/NFTMarketPlace.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

struct PurchaseData
{
    address vendor;
    uint32 NFTId;       // uint32 saves some gas, we also assume this marketplace is temporary so it's enough slots.
}

struct CustomerData
{
    mapping(uint256 => PurchaseData) purchases;
    uint256 purchaseCount;
}

struct ProductData
{
    uint256 price;
    uint256 supply;
    uint256 sold;
}

struct VendorData
{
    mapping(uint256 => ProductData) products;
    uint256 productCount;
}

/**
 * @dev A marketplace contract with a single funds holder address.
 * Stores NFT purchase history for later minting.
 * Minting will be done in a separate contract where customer wallets will be given access to mint.
 */
contract NFTMarketPlace
{
    using SafeERC20 for IERC20;
    IERC20      private immutable   _token;          // ERC20 token contract
    address     private immutable   _storeWallet;    // wallet where all the funds will go.

    mapping(address => CustomerData)        private _customerPurchases;     // purchases made by addresses.
    mapping(uint256 => address)             private _customers;             // required to retrieve all customers without knowing all addresses.
    uint256                                 private _customerCount;         // required to retrieve all customers without knowing all addresses.

    mapping(address => VendorData)          private _vendorProducts;        // products added by address.
    mapping(uint256 => address)             private _vendors;               // required to retrieve all vendors without knowing all addresses.
    uint256                                 private _vendorCount;           // required to retrieve all vendors without knowing all addresses.

    /**
     * @notice  token_                  - ERC20 token contract address. Marketplace currency.
     */
    constructor(
        IERC20  token_
    ) {
        _token          = token_;
        _storeWallet    = msg.sender;
    }

    /**
     *  @notice adds product to the marketplace with a fixed price and supply.
     *          price_       - amount of ERC20 tokens required to purchase (single NFT).
     *          supply_      - total amount of same type of NFT's.
     */
    function sellNFT(uint256 price_, uint256 supply_) external
    {
        _vendorProducts[msg.sender].products[_vendorProducts[msg.sender].productCount].price    = price_;
        _vendorProducts[msg.sender].products[_vendorProducts[msg.sender].productCount].supply   = supply_;

        // add new buyer
        if (_vendorProducts[msg.sender].productCount == 0)
        {
            _vendors[_vendorCount] = msg.sender;
            _vendorCount++;
        }

        _vendorProducts[msg.sender].productCount++;
    }

    /**
     *  @notice Removes an NFT from sale by setting a supply to 0.
     *          productID_    - ID of the NFT created by vendor.
     */
    function cancelNFTSale(uint32 NFTId_) external
    {
        _vendorProducts[msg.sender].products[NFTId_].supply = 0;
    }

    /**
     *  @notice
     *          vendor_       - vendor wallet address. (one that was used to add a product).
     *          productID_    - ID of the NFT created by vendor.
     */
    function buyNFT(address vendor_, uint32 NFTId_) external
    {
        ProductData memory product = _vendorProducts[vendor_].products[NFTId_];

        // check if possible to buy this product.
        require(product.sold < product.supply, "Product supply is empty.");

        // check if buyer has enough ERC20 token to buy this NFT.
        require(_token.balanceOf(msg.sender) >= product.price, "Not enough ERC20 token to buy this NFT.");

        // check if store has enough approval to use senders ERC20.
        require(_token.allowance(msg.sender, address(this)) >= product.price, "Store doesn't have allowance to use senders ERC20 tokens.");

        // transfer funds.
        _token.safeTransferFrom(msg.sender, _storeWallet, product.price);

        // increment sold counter.
        _vendorProducts[vendor_].products[NFTId_].sold++;

        _customerPurchases[msg.sender].purchases[_customerPurchases[msg.sender].purchaseCount].vendor         = vendor_;
        _customerPurchases[msg.sender].purchases[_customerPurchases[msg.sender].purchaseCount].NFTId          = NFTId_;

        // add new buyer
        if (_customerPurchases[msg.sender].purchaseCount == 0)
        {
            _customers[_customerCount] = msg.sender;
            _customerCount++;
        }

        _customerPurchases[msg.sender].purchaseCount++;
    }


    /**
     *  @notice returns customer count.
     */
    function getCustomerCount() external view returns (uint256)
    {
        return _customerCount;
    }

    /**
     *  @notice returns customer purchase count.
     */
    function getCustomerPurchaseCount(address customer_) external view returns (uint256)
    {
        return _customerPurchases[customer_].purchaseCount;
    }

    /**
     *  @notice returns customer purchase data.
     */
    function getCustomerPurchaseData(address customer_, uint256 purchaseID) external view returns (address vendor, uint32 NFTId)
    {
        return (_customerPurchases[customer_].purchases[purchaseID].vendor,
                _customerPurchases[customer_].purchases[purchaseID].NFTId);
    }

    /**
     *  @notice returns vendor count.
     */
    function getVendorCount() external view returns (uint256)
    {
        return _vendorCount;
    }

    /**
     *  @notice returns vendor product count.
     */
    function getVendorProductCount(address vendor_) external view returns (uint256)
    {
        return _vendorProducts[vendor_].productCount;
    }

    /**
     *  @notice returns vendor product data.
     */
    function getVendorProductData(address vendor_, uint32 productID_) external view returns (uint256 price, uint256 supply, uint256 sold)
    {
        return (_vendorProducts[vendor_].products[productID_].price,
                _vendorProducts[vendor_].products[productID_].supply,
                _vendorProducts[vendor_].products[productID_].sold);
    }

    /**
     *  @notice returns market place currency ERC20 token.
     */
    function getCurrency() external view returns (IERC20)
    {
        return _token;
    }

    /**
     *  @notice releases tokens accidentally transferred to this contract address. Can provide any ERC20 token address.
     *          anybody can call this function, we don't care since all funds go to store wallet.
     */
    function releaseTokens(IERC20 token_) external
    {
        token_.transfer(_storeWallet, token_.balanceOf(address(this)));
    }
}