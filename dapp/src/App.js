import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import StatusDisplay from "./components/StatusDisplay";
import Web3 from "web3";

function App() {
  const [status, setStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

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
      
      const web3 = new Web3(Web3.givenProvider);
      const chainId = await web3.eth.getChainId();
      
      if (chainId != 10200 && chainId != 100){
        setStatus("Please switch to Gnosis Chain");
        return;
      }

      
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
        from: walletAddress,
        to: process.env.REACT_APP_VALIDATOR_REGISTRY_ADDRESS,
        data: encodedData,
      };
      
      const receipt = await web3.eth.sendTransaction(tx);
      setTransactionHash(receipt.transactionHash);
      setStatus("Transaction successful!");
      setUploadedFile(null); // Clear the uploaded file after successful transaction
    } catch (error) {
      console.error("Transaction error details:", {
        message: error.message,
        code: error.code,
        data: error.data
      });
      setStatus(`Error submitting the transaction: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Validator Registration DApp</h1>
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
          marginBottom: "20px"
        }}
      >
        {isConnected ? "Connected" : "Connect Wallet"}
      </button>
      <FileUpload onFileUpload={handleFileUpload} />
      {uploadedFile && (
        <button 
          onClick={sendTransaction}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "20px",
            marginBottom: "20px"
          }}
        >
          Send Transaction
        </button>
      )}
      <StatusDisplay status={status} transactionHash={transactionHash} walletAddress={walletAddress} />
    </div>
  );
}

export default App;
