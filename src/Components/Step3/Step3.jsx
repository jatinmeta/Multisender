import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './Step3.css';

const tokenContracts = 
{
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
};

const Step3 = ({ sharedState, updateSharedState, onBack }) => 
{
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");

  // Generate a CSV receipt
  const generateCSV = () => {
    const headers = ["Recipient", "Amount (ETH)", "Transaction Status"];
    const rows = sharedState.addresses.map((address, index) => {
      return [
        address,
        ethers.utils.formatUnits(sharedState.amounts[index], 18), // Format amounts to ETH
        sharedState.receipt ? "Success" : "Failed"
      ];
    });

    // Prepare CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Add Sender Address and Estimated Gas info at the top
    const senderAddressRow = `Sender Address: ${sharedState.walletAddress}, Estimated Gas: ${ethers.utils.formatUnits(sharedState.estimatedGas, 0)} wei`;
    const finalCSV = `${senderAddressRow}\n\n${csvContent}`;

    // Create a Blob and URL for downloading
    const blob = new Blob([finalCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    setDownloadLink(url);
  };

  const handleSend = async () => {
    if (sharedState.addresses.length === 0 || sharedState.amounts.length === 0) {
      updateSharedState({ errorMessage: "No valid transactions!" });
      return;
    }

    setIsLoading(true);
    updateSharedState({ errorMessage: "" });

    try 
    {
      const { provider, signer, contract, selectedToken, addresses, amounts, customTokenAddress } = sharedState;
      const network = await provider.getNetwork();
      // console.log("Current Network:", network);

      if (selectedToken === "ETH") {
        const totalValue = amounts.reduce((acc, amount) => acc.add(amount), ethers.BigNumber.from(0));
        const estimatedGas = await contract.estimateGas.batchSendETH(addresses, amounts, { value: totalValue });
        const tx = await contract.batchSendETH(addresses, amounts, {
          value: totalValue,
          gasLimit: estimatedGas,
        });

        const receipt = await tx.wait();
        updateSharedState({
          receipt: receipt,
          txnHash: tx.hash,
          errorMessage: "",
          estimatedGas: estimatedGas.toString(),
        });
      } else {
        const tokenAddress = selectedToken === "CUSTOM" ? customTokenAddress : tokenContracts[selectedToken];
        const tx = await contract.batchSendERC20(tokenAddress, addresses, amounts, {
          gasLimit: sharedState.estimatedGas,
        });

        const receipt = await tx.wait();
        updateSharedState({
          receipt: receipt,
          txnHash: tx.hash,
          errorMessage: "",
          estimatedGas: sharedState.estimatedGas.toString(),
        });
      }

      generateCSV(); // Generate CSV after transaction is completed
    } 
    catch (error) {
      console.error("Transaction Error:", error);

      let detailedErrorMessage = "Transaction failed: ";
      if (error.code === "INSUFFICIENT_FUNDS") {
        detailedErrorMessage += "Insufficient funds for transaction";
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        detailedErrorMessage += "Unable to estimate gas. Check contract and input.";
      } else if (error.reason) {
        detailedErrorMessage += error.reason;
      } else {
        detailedErrorMessage += error.message || "Unknown error occurred";
      }

      updateSharedState({ errorMessage: detailedErrorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="step3-wrapper">
      {/* Display error message */}
      {sharedState.errorMessage && <div className="error-message">{sharedState.errorMessage}</div>}

      {/* Display transaction processing status */}
      {isLoading ? (
        <p>Processing transaction...</p>
      ) : (
        <button className="send-button" onClick={handleSend} disabled={isLoading}>
          Send Batch Transaction
        </button>
      )}

      {/* Transaction Confirmation Section */}
      {sharedState.txnHash && (
        <div className="txn-confirmation">
          <h1></h1>
          <p>
          View your transaction details on {" "}
            <a href={`https://etherscan.io/tx/${sharedState.txnHash}`}target="_blank" rel="noopener noreferrer" className="etherscan-link">
              Etherscan 
              {/* <img src="/public/icons8-share-24 (1).png" alt="Etherscan redirect icon" className="etherscan-icon" />
               */}
            </a>
          </p>
          {sharedState.receipt && (
            <div className="receipt-info">
              {/* <h3>Transaction Receipt:</h3> */}
              {/* <pre>{JSON.stringify(sharedState.receipt, null, 2)}</pre> */}
            </div>
          )}
        </div>
      )}
<h2> Transaction Receipt</h2>
      {/* Provide download link for the receipt */}
      {downloadLink && (
        <div className="download-section">
          {/* <h3>Download Receipt (CSV)</h3> */}
          <a href={downloadLink} download="transaction_receipt.csv">
            Click here to download the receipt
          </a>
        </div>
      )}

      <div className="back-button-section">
        <button className="back-button" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default Step3;
