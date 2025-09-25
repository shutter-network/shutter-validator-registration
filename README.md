### **Validator Registration Workflow**

This guide provides step-by-step instructions for generating validator registration signatures 
using a existing validator keystore files and submitting them to the Gnosis Chain using a DApp. It also includes an optional step for uploading registration files when the DApp is hosted on a separate machine.

---

## **Overview**

The workflow consists of two main components:
1. **Signature generator**:
   - Uses an existing validator keystore files to create the `signedRegistrations.json` file required for registration.
2. **Validator Registration DApp**:
   - Either automatically uses the `signedRegistrations.json` file generated above, 
   - Or allows the user to upload the `signedRegistrations.json` file manually
     
     (useful when the DApp is hosted on a separate machine, see below for details).
   - Submits the registration to the `VALIDATOR_REGISTRY_ADDRESS` smart contract.

---

## **1. Signature generator**

### **Features**
- Uses existing validator keystore files to generate registration signatures.
- Creates the `signedRegistrations.json` file with validator registration data.
- Preconfigured with Gnosis Chain endpoints and contract addresses.

---

### **Requirements**

- Docker and the docker compose plugin installed on your system.
- Access to:
  - Validator keystore files for your validator keys.
  - The password for the keystore files.

#### **Configured `.env` File**
The `.env.example` file is provided as a template. Copy it to create your own `.env` file.

```bash
cp .env.example .env
```

#### **Provide your configuration**
Replace the placeholders (valued in angle brackets) in the `.env` file with your actual values:

Example:
```plaintext
# Path to Keystore Files
KEYSTORE_DIR=/some/path/to/validator_keys

# Validator Keystore Password
KEYSTORE_PASSWORD=very-secure-password

# Validator start and end index (inclusive) 
# Registration signatures will be generated for these indices.
VALIDATOR_START_INDEX=4242
VALIDATOR_END_INDEX=4243
```

---

### **How to Run**

How you run the script depends on whether you want to run both parts (signature generator and DApp) on the same machine or on separate ones. 
The easiest is to run both parts on the same machine where your validator is also running.

#### **Step 1: Build the docker images**
Build the validator script Docker image:
```bash
docker compose build
```

#### **Step 2: Run the Signature Generator**

Run the Docker container to generate registration signatures:
```bash
docker compose up signer
```

---

### **Outputs**

1. **`registrations/signedRegistrations.json`**:
   - Contains the `message` and `signature` required for registration.

2. **`registrations/validatorInfo.json`**:
   - Contains metadata necessary for running your validator client with Shutter enabled.

---

#### **Step 3: Run the registration DApp** 

### **Optional Step: Upload Registration Files**

If you are generating registration files on a remote server (e.g., via SSH) and need to upload them to a machine running the DApp, follow these steps:

#### **Using SCP (Secure Copy)**
1. On your local machine, run:
   ```bash
   scp -r user@server:/path/to/output/signedRegistrations.json /local/path/
   ```
   - Replace `user` with your SSH username.
   - Replace `/path/to/output/` with the directory where the registration files are saved on the server.
   - Replace `/local/path/` with the directory on your local machine where the file should be copied.

#### **Using SFTP**
1. Open an SFTP session:
   ```bash
   sftp user@server
   ```
2. Navigate to the output directory:
   ```bash
   cd /path/to/output/
   ```
3. Download the file:
   ```bash
   get signedRegistrations.json
   ```

---

### **Requirements**

#### **Preconfigured `.env` File**
The `dapp/.env.example` file is provided with preconfigured values. Copy it to create your own `.env` file.

```bash
cp dapp/.env.example dapp/.env
```

#### **Example `.env` (dapp/.env.example)**
```plaintext
REACT_APP_EL_ENDPOINT=https://rpc.gnosis.gateway.fm
REACT_APP_VALIDATOR_REGISTRY_ADDRESS=0xefCC23E71f6bA9B22C4D28F7588141d44496A6D6
```

---

### **How to Run**

#### **Option 1: Local Development**

1. Navigate to the `dapp/` directory:
   ```bash
   cd dapp/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open the DApp in your browser:
   ```plaintext
   http://localhost:3000
   ```

---

#### **Option 2: Run Using Docker**

1. Build the Docker image:
   ```bash
   docker build -t validator-dapp -f docker/Dockerfile.dapp .
   ```

2. Run the Docker container:
   ```bash
   docker run --rm -p 3000:3000 validator-dapp
   ```

3. Open the DApp in your browser:
   ```plaintext
   http://localhost:3000
   ```

---

### **Using the DApp**

1. **Connect Wallet**:
   - Connect your Web3 wallet (e.g., MetaMask).
   - Ensure the wallet has sufficient funds to cover gas fees.

2. **Upload `signedRegistrations.json`**:
   - Use the file upload button to select the `signedRegistrations.json` file generated by the script.

3. **Submit Signatures through transaction**:
   - Click the "Send Transaction" button to send the registration data.
   - Wait for the transaction confirmation.

4. **View Transaction**:
   - The DApp will display the transaction hash.
   - You can view it on [GnosisScan](https://gnosisscan.io/).

---

## **3. Validator Node Setup**

Use the `validatorInfo.json` file generated by the script to configure your validator node.

#### **Example Command for Nethermind**
```bash
nethermind --Shutter.Enabled=true --Shutter.ValidatorInfoFile=/path/to/output/validatorInfo.json
```

---

## **4. Directory Structure**

```
project-root/
├── output/
│   ├── signedRegistrations.json   # Registration signatures
│   ├── validatorInfo.json         # Validator configuration
├── dapp/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   ├── index.js
│   ├── .env                       # DApp configuration (ignored in Git)
│   ├── .env.example               # Example DApp configuration
│   ├── Dockerfile
│   ├── package.json
├── script/
│   ├── validator_script.js        # Main validator script
│   ├── .env                       # Script configuration (ignored in Git)
│   ├── .env.example               # Example script configuration
├── docker/
│   ├── Dockerfile.script          # Dockerfile for the script
│   ├── Dockerfile.dapp            # Dockerfile for the DApp
├── README.md                      # This documentation
