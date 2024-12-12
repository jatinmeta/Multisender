import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './Step2.css';
const tokenContracts = 
{
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
};

const CONTRACT_ADDRESS = "";//0x0Ce7cF16730733aef9C988C1b9269Ce75834CE9A

const Step2 = ({ sharedState, updateSharedState, onNext, onBack }) => {
  const [totalAmount, setTotalAmount] = useState("0");
  const [sufficientBalance, setSufficientBalance] = useState(true);

  useEffect(() => 
  {
    
    let total = sharedState.amounts.reduce(
      (acc, amount) => acc.add(amount),
      ethers.BigNumber.from(0)
    );


    let Total_ = ethers.utils.formatUnits(total, 18);
    setTotalAmount(Total_);
    updateSharedState({totalAmount: Total_ });
    // console.log("Total_=",Total_);
    let Balance_ =0;
    if(sharedState.selectedToken === "CUSTOM" )
    {
      Balance_ = parseFloat(sharedState.custom_token_balance);
    }
    else if(sharedState.selectedToken === "ETH" )
    {
      Balance_ = parseFloat(sharedState.ethBalance);
    }
    else
    {
      Balance_ = parseFloat(sharedState.token_balance);
    }
    
    const totalValue = parseFloat(Total_);
    // const estimatedGasCost = 0.0094; // Estimated gas cost in ETH
    // setSufficientBalance(Balance_ >= Total_ + calculateGas);
    setSufficientBalance(Balance_ >= totalValue);

  }, [sharedState.amounts, sharedState.ethBalance]);

  const calculateGas = async () => {
    try 
    {
          const contract = sharedState.contract;
          let estimatedGas;

          if (sharedState.selectedToken === "ETH") 
          {
            const totalValue = sharedState.amounts.reduce(
              (acc, amount) => acc.add(amount),
              ethers.BigNumber.from(0)
            );
            estimatedGas = await contract.estimateGas.batchSendETH(
              sharedState.addresses,
              sharedState.amounts,
              { value: totalValue }
            );
          } 
          else 
          {   
            const tokenAddress = sharedState.selectedToken === "CUSTOM" ? sharedState.customTokenAddress : tokenContracts[sharedState.selectedToken];
            // console.log("Token Address:", tokenAddress);
            const tokenContract = new ethers.Contract(tokenAddress, 
              ["function approve(address spender, uint256 amount) external returns (bool)",
              "function allowance(address owner, address spender) view returns (uint256)"
              ],
              sharedState.signer
          );

          const totalAmount =  sharedState.amounts.reduce((acc, amount) => acc.add(amount), ethers.BigNumber.from(0));
          // console.log("Total Amount:", totalAmount.toString());
          const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, totalAmount);
          await approveTx.wait();

            
          // console.log("sharedState",sharedState);

          
          // let tx  = await contract.estimateGas.aaa();
          // console.log("tokenAddress=",tokenAddress);
          estimatedGas = await contract.estimateGas.batchSendERC20(
            tokenAddress,
            sharedState.addresses,
            sharedState.amounts.map(amount => amount.toString()),
            { gasLimit: 210000 }
          );
          // console.log("estimatedGas=",estimatedGas.toString());
        }
        
        updateSharedState({ estimatedGas: estimatedGas.toString() });
    } 
    catch (error) 
    {
      console.error("Gas estimation error:", error);
      // updateSharedState({ errorMessage: "Could not estimate gas" });
    }
  };

  const handleRemoveRecipient = (index) => {
    const updatedAddresses = [...sharedState.addresses];
    const updatedAmounts = [...sharedState.amounts];
    updatedAddresses.splice(index, 1);
    updatedAmounts.splice(index, 1);

    updateSharedState({
      addresses: updatedAddresses,
      amounts: updatedAmounts,
    });
  };

  useEffect(() => {
    calculateGas();
  }, [sharedState.addresses, sharedState.amounts, sharedState.selectedToken]);

  return (
    <div className="step2-container">
      {/* <h1>Batch Transfer - Confirm</h1> */}

      <div className="table-container">
        <h3 className="subheading">List of Recipients</h3>
        <table className="recipients-table">
          <thead>
            <tr>
              <th>Recipient Address</th>
              <th>Amount ({sharedState.selectedToken === "CUSTOM"?sharedState.custom_token_symbol:sharedState.selectedToken})</th>
              <th>Action</th> {/* New column for "Remove" */}
            </tr>
          </thead>
          <tbody>
            {sharedState.addresses.map((recipient, index) => (
              <tr key={index} className="table-row">
                <td>{recipient.slice(0, 6)}.....{recipient.slice(-6)}</td>
                <td>{ethers.utils.formatUnits(sharedState.amounts[index], 18)}</td>
                <td>
                  <button
                    onClick={() => handleRemoveRecipient(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-container">
        <h3 className="subheading">Transaction Summary</h3>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Details</th>
              <th>Values</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total number of addresses:</td>
              <td>{sharedState.addresses.length}</td>
            </tr>
            <tr>
              <td>Total number of tokens to be sent:</td>
              <td>{totalAmount} {sharedState.selectedToken === "CUSTOM"? sharedState.custom_token_symbol: sharedState.selectedToken}</td>
            </tr>
            <tr>
              <td>Total number of transactions needed:</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Your token balance:</td>
              <td>
              {sharedState.selectedToken === "ETH" && `${sharedState.ethBalance} `}
              {sharedState.selectedToken !== "ETH" && sharedState.selectedToken !== "CUSTOM" && `${sharedState.token_balance} ${sharedState.selectedToken}`}
              {sharedState.selectedToken === "CUSTOM" && `${sharedState.custom_token_balance} ${sharedState.custom_token_symbol}`}
            </td>
            </tr>
            <tr>
              <td>Approximate cost of operation:</td>
              <td>{sharedState.estimatedGas} Wei</td>
            </tr>
          </tbody>
        </table>

        <div className="buttons-container">
          <button onClick={onBack}>Back</button>
          <button onClick={onNext} disabled={!sufficientBalance}>
            Next: Send
          </button>
        </div>

        {!sufficientBalance && (
          <div className="insufficient-balance-warning">
            Insufficient ETH balance. Please have at least{" "}
            {(parseFloat(totalAmount) + 0.004).toFixed(4)} ETH
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2;
