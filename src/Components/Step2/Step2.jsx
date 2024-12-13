import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './Step2.css';

const tokenContracts = {
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
};

const CONTRACT_ADDRESS = "0x40BFA789014FCC59922585D08DB3C64F9eb7e445";

const Step2 = ({ sharedState, updateSharedState, onNext, onBack }) => {
  const [totalAmount, setTotalAmount] = useState("0");
  const [sufficientBalance, setSufficientBalance] = useState(true);

  // Function to adjust amounts based on decimals
  const adjustAmountDecimals = async (amount, fromDecimals, toDecimals) => {
    // Convert to a regular number string with fromDecimals
    const normalizedAmount = ethers.utils.formatUnits(amount, fromDecimals);
    // Parse back with correct decimals
    return ethers.utils.parseUnits(normalizedAmount, toDecimals);
  };

  useEffect(() => {
    let total = sharedState.amounts.reduce(
      (acc, amount) => acc.add(amount),
      ethers.BigNumber.from(0)
    );

    // Format total based on the selected token's decimals
    const decimals = sharedState.selectedToken === "CUSTOM" 
      ? (sharedState.custom_token_decimals || 18)
      : (sharedState.token_decimals || 18);

    let Total_ = ethers.utils.formatUnits(total, decimals);
    setTotalAmount(Total_);
    updateSharedState({totalAmount: Total_ });

    let Balance_ = 0;
    if(sharedState.selectedToken === "CUSTOM") {
      Balance_ = parseFloat(sharedState.custom_token_balance);
    } else if(sharedState.selectedToken === "ETH") {
      Balance_ = parseFloat(sharedState.ethBalance);
    } else {
      Balance_ = parseFloat(sharedState.token_balance);
    }
    
    const totalValue = parseFloat(Total_);
    setSufficientBalance(Balance_ >= totalValue);
  }, [sharedState.amounts, sharedState.ethBalance]);

  const calculateGas = async () => {
    try {
      const contract = sharedState.contract;
      let estimatedGas;

      if (sharedState.selectedToken === "ETH") {
        const totalValue = sharedState.amounts.reduce(
          (acc, amount) => acc.add(amount),
          ethers.BigNumber.from(0)
        );
        estimatedGas = await contract.estimateGas.batchSendETH(
          sharedState.addresses,
          sharedState.amounts,
          { value: totalValue }
        );
      } else {
        const tokenAddress = sharedState.selectedToken === "CUSTOM" 
          ? sharedState.customTokenAddress 
          : tokenContracts[sharedState.selectedToken];

        const tokenContract = new ethers.Contract(
          tokenAddress,
          [
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function safeApprove(address spender, uint256 amount) external;"
          ],
          sharedState.signer
        );

        const decimals = await tokenContract.decimals();
        console.log("decimal=", decimals);

        // Adjust amounts to the correct decimals
        const adjustedAmounts = await Promise.all(
          sharedState.amounts.map(async (amount) => {
            return adjustAmountDecimals(amount, 18, decimals);
          })
        );

        console.log("Adjusted amounts:", adjustedAmounts.map(a => a.toString()));

        const totalAmount = adjustedAmounts.reduce(
          (acc, amount) => acc.add(amount),
          ethers.BigNumber.from(0)
        );

        console.log("Total Amount:", totalAmount.toString());



        // Step 2: Approve the new amount
        // const data = tokenContract.interface.encodeFunctionData("approve", [CONTRACT_ADDRESS, totalAmount]);
  
        // // Execute the low-level transaction
        // const tx = await sharedState.signer.sendTransaction({
        //   to: tokenContract.address,
        //   data: data,
        //   gasLimit: ethers.utils.hexlify(210000), // Ensure the gas limit is adequate
        // });


        const resetTx = await tokenContract.approve(CONTRACT_ADDRESS, 0);
        await resetTx.wait();
        console.log("Previous approval cleared:", resetTx);
  
        const resetTx1 = await tokenContract.approve(CONTRACT_ADDRESS, totalAmount);
        await resetTx1.wait();
        console.log("Previous approval cleared:", resetTx1);


 
  
        // await tx.wait();
        // console.log("USDT approval successful:", tx);

        estimatedGas = await contract.estimateGas.batchSendERC20(
          tokenAddress,
          sharedState.addresses,
          adjustedAmounts,
          { gasLimit: 210000 }
        );
        console.log("Estimated Gas:", estimatedGas.toString());
      }   
      updateSharedState({ estimatedGas: estimatedGas.toString() });
    } catch (error) {
      console.error("Gas estimation error:", error);
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

  const formatDisplayAmount = (amount) => {
    const decimals = sharedState.selectedToken === "CUSTOM" 
      ? (sharedState.custom_token_decimals || 18)
      : (sharedState.token_decimals || 18);
    return ethers.utils.formatUnits(amount, decimals);
  };

  return (
    <div className="step2-container">
      <div className="table-container">
        <h3 className="subheading">List of Recipients</h3>
        <table className="recipients-table">
          <thead>
            <tr>
              <th>Recipient Address</th>
              <th>Amount ({sharedState.selectedToken === "CUSTOM" ? sharedState.custom_token_symbol : sharedState.selectedToken})</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sharedState.addresses.map((recipient, index) => (
              <tr key={index} className="table-row">
                <td>{recipient.slice(0, 6)}.....{recipient.slice(-6)}</td>
                <td>{formatDisplayAmount(sharedState.amounts[index])}</td>
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
              <td>{totalAmount} {sharedState.selectedToken === "CUSTOM" ? sharedState.custom_token_symbol : sharedState.selectedToken}</td>
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
            Insufficient balance. Please check your token balance.
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2;



// const tx1 = await tokenContract.populateTransaction.approve(CONTRACT_ADDRESS, 0);
// const tx2 = await tokenContract.populateTransaction.approve(CONTRACT_ADDRESS, totalAmount);


//         const batch = [
//           { to: tokenContract.address, data: tx1.data },
//           { to: tokenContract.address, data: tx2.data },
//           // { to: contract.address, data: tx3.data }
//         ];

//         const txResponse = await provider.sendBatch(batch);
//         const receipts = await Promise.all(txResponse.map(tx => tx.wait()));
// let totalGasUsed = ethers.BigNumber.from(0);
// receipts.forEach(receipt => {
//   totalGasUsed = totalGasUsed.add(receipt.gasUsed);
// });

// console.log(totalGasUsed.toString(), `Total Gas Used for All Transactions: ${ethers.utils.formatUnits(totalGasUsed, 'gwei')} Gwei`);


