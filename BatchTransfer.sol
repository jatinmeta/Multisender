// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);}

contract BatchTransfer 
{
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
        for (uint256 i = 0; i < recipients.length; i++) 
        {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(IERC20(token).transferFrom(msg.sender,recipients[i], amounts[i]),"ERC-20 transfer failed");
        }
    }

    receive() external payable {}
}
