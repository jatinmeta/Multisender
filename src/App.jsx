import React, { useState, useEffect } from "react";
import Step1 from "./Components/Step1/Step1";
import Step2 from "./Components/Step2/Step2";
import Step3 from "./Components/Step3/Step3";
// import Footer from "./Components/Footer";
import "./App.css";

const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sharedState, setSharedState] = useState({
    walletAddress: "",
    addresses: [],
    amounts: [],
    selectedToken: "ETH",
    customTokenAddress: "",
    totalAmount: "0",
    estimatedGas: null,
    receipt: null,
    txnHash: null,
    errorMessage: "",
    custom_token_balance:"0",
    custom_token_symbol:"ERC20",
    token_balance:"0",
    provider: null,
    signer: null,
    contract: null,
    ethBalance: null
  });

  const updateSharedState = (updates) => {
    setSharedState(prevState => ({
      ...prevState,
      ...updates
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
    <div className="step-container">
      <h1>Welcome to Metaschool Token MultiSender </h1>
      
      <div className="steps">
        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
          <span className="step-number">1</span> Prepare
        </div>
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
          <span className="step-number">2</span> Confirm
        </div>
        <div className={`step ${currentStep === 3 ? 'active' : ''}`}>
          <span className="step-number">3</span> Send
        </div>
      </div>
      <div className="step-content">
        {currentStep === 1 && (
          <Step1 
            sharedState={sharedState} 
            updateSharedState={updateSharedState} 
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <Step2 
            sharedState={sharedState} 
            updateSharedState={updateSharedState} 
            onNext={handleNext} 
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <Step3 
            sharedState={sharedState} 
            updateSharedState={updateSharedState}
            onBack={handleBack}
          />
        )}
      </div>
      
    </div>
    {/* <Footer></Footer> */}
    </>
   
  );
};

export default App;