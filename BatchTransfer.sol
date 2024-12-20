// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 
{
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    
}

library SafeERC20 
{
    function safeTransferFrom(IERC20 token,address sender,address recipient,uint256 amount) internal 
    {
        // Call transferFrom
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transferFrom.selector,sender,recipient,amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))),"SafeERC20: Transfer failed");
    }
}

contract BatchTransfer 
{
    using SafeERC20 for IERC20;
    function batchSendETH(address[] calldata recipients, uint256[] calldata amounts) external payable 
    {   
        require(recipients.length > 0, "No recipients provided");
        require(amounts.length > 0, "No amounts provided");
        require(recipients.length == amounts.length, "Mismatched recipients and amounts");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) 
        {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            total += amounts[i];
        }
        require(msg.value >= total, "Insufficient ETH sent");

        for (uint256 i = 0; i < recipients.length; i++) 
        {
            (bool success, ) = payable(recipients[i]).call{value: amounts[i]}("");
            if (!success) { revert("ETH transfer failed");}
        }
    }


    function batchSendERC20(address token,address[] calldata recipients,uint256[] calldata amounts) external 
    { 
        require(token != address(0), "Invalid token address");
        require(recipients.length > 0, "No recipients provided");
        require(amounts.length > 0, "No amounts provided");
        require(recipients.length == amounts.length, "Mismatched recipients and amounts");

        uint256 total = 0;

        for (uint256 i = 0; i < amounts.length; i++) 
        {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            total += amounts[i];
        }

        require(IERC20(token).balanceOf(msg.sender) >= total, "Insufficient balance");
        require(IERC20(token).allowance(msg.sender, address(this)) >= total, "Insufficient allowance");  // Check allowance

        for (uint256 i = 0; i < recipients.length; i++) 
        {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            IERC20(token).safeTransferFrom(msg.sender, recipients[i], amounts[i]);
        }
    }

    receive() external payable {}
}
