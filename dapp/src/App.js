import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import UseSignedRegistrations from "./components/UseSignedRegistrations";
import StatusDisplay from "./components/StatusDisplay";
import Web3 from "web3";

function App({ signedRegistrations }) {
  const [status, setStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const web3 = new Web3(Web3.givenProvider);
        const accounts = await web3.eth.requestAccounts();
        const chainId = await web3.eth.getChainId();
        
        if (chainId != 10200 && chainId != 100) {
          setStatus("Please switch to Gnosis Chain");
          return;
        }
        
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setStatus("Wallet connected successfully!");
        setCurrentStep(2);
      } else {
        setStatus("Please install MetaMask!");
      }
    } catch (error) {
      setStatus(`Error connecting wallet: ${error.message}`);
    }
  };

  const handleFileUpload = async (fileContent) => {
    try {
      if (!isConnected) {
        setStatus("Please connect your wallet first!");
        return;
      }

      const { message, signature } = JSON.parse(fileContent);
      setUploadedFile({ message, signature });
      setStatus("File uploaded successfully! Click 'Send Transaction' to proceed.");
      setCurrentStep(3);
    } catch (error) {
      setStatus(`Error processing file: ${error.message}`);
    }
  };

  const sendTransaction = async () => {
    try {
      if (!uploadedFile) {
        setStatus("Please upload a file first!");
        return;
      }

      if (!isConnected) {
        setStatus("Please connect your wallet first!");
        return;
      }

      const { message, signature } = uploadedFile;
      setStatus("Preparing transaction...");
      
      // Connect to wallet
      const web3 = new Web3(Web3.givenProvider || process.env.EL_ENDPOINT);
      const accounts = await web3.eth.requestAccounts();
      setWalletAddress(accounts[0]);

      const encodedData = web3.eth.abi.encodeFunctionCall(
        {
          inputs: [
            { name: "message", type: "bytes" },
            { name: "signature", type: "bytes" },
          ],
          name: "update",
          type: "function",
        },
        [message, signature]
      );

      const tx = {
        from: accounts[0],
        to: process.env.REACT_APP_VALIDATOR_REGISTRY_ADDRESS,
        data: encodedData,
      };
      
      const receipt = await web3.eth.sendTransaction(tx);
      setTransactionHash(receipt.transactionHash);
      setStatus("Transaction successful!");
      setUploadedFile(null);
      setCurrentStep(1);
    } catch (error) {
      console.error("Transaction error details:", {
        message: error.message,
        code: error.code,
        data: error.data
      });
      setStatus(`Error submitting the transaction: ${error.message}`);
    }
  };

  const steps = [
    { number: 1, title: "Connect Wallet", completed: isConnected },
    { number: 2, title: "Upload File", completed: !!uploadedFile },
    { number: 3, title: "Submit Transaction", completed: !!transactionHash }
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Validator Registration DApp</h1>
      <p>Web interface for validator registration for shutterized gnosis chain.</p>
      {/* Steps Indicator */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginBottom: "40px",
        position: "relative"
      }}>
        {steps.map((step, index) => (
          <div key={step.number} style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            position: "relative",
            zIndex: 1
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: step.completed ? "#4CAF50" : currentStep === step.number ? "#2196F3" : "#e0e0e0",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px",
              fontWeight: "bold"
            }}>
              {step.number}
            </div>
            <div style={{ 
              fontSize: "14px",
              color: step.completed ? "#4CAF50" : currentStep === step.number ? "#2196F3" : "#666"
            }}>
              {step.title}
            </div>
          </div>
        ))}
        {/* Progress Line */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "0",
          right: "0",
          height: "2px",
          backgroundColor: "#e0e0e0",
          zIndex: 0
        }} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={connectWallet}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isConnected ? "#4CAF50" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%",
            marginBottom: "20px"
          }}
        >
          {isConnected ? "Wallet Connected" : "Connect Wallet"}
        </button>
      </div>

      {isConnected && (
        <div style={{ marginBottom: "20px" }}>
          <UseSignedRegistrations signedRegistrations={signedRegistrations} onFileUpload={handleFileUpload} />
          <FileUpload onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
        </div>
      )}

      {uploadedFile && (
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={sendTransaction}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#FF7043",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%"
            }}
          >
            Send Transaction
          </button>
        </div>
      )}

      <StatusDisplay status={status} transactionHash={transactionHash} walletAddress={walletAddress} />
    </div>
  );
}

export default App;
