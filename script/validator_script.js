import fs from "fs";
import { execSync } from "child_process";
import fetch from "node-fetch";
import loadWeb3 from "web3";
import { decrypt, Keystore } from "@chainsafe/bls-keystore";
import bls from "@chainsafe/bls";

const dst = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
const web3 = new loadWeb3(process.env.EL_ENDPOINT);
const validatorRegistryVersion = 1;

async function generateValidatorKeys(numValidators, outputDir) {
    console.log("Generating validator keys...");
    const command = [
        "docker run -it --rm",
        `-v ${outputDir}:/app/validator_keys`,
        "ghcr.io/gnosischain/validator-data-generator:latest",
        `new-mnemonic --num_validators=${numValidators} --mnemonic_language=english --folder=/app/validator_keys`
    ];
    execSync(command.join(" "), { stdio: "inherit" });
    console.log("Validator keys generated successfully!");
}

async function loadKeystore(keystorePath, password) {
    const keystoreRaw = fs.readFileSync(keystorePath).toString();
    const keystore = Keystore.fromObject(JSON.parse(keystoreRaw));
    const pk = "0x" + keystore.pubkey;
    const skBytes = await decrypt(keystore, password);
    const sk = bls.SecretKey.fromBytes(skBytes);
    return [sk, pk];
}

async function getValidators(beaconEndpoint) {
    const response = await fetch(beaconEndpoint + "/eth/v1/beacon/states/head/validators");
    if (response.status === 200) {
        return (await response.json()).data;
    }
    throw new Error("Failed to fetch validators");
}

function getValidatorIndex(pubkey, validators) {
    for (let validator of validators) {
        if (pubkey === validator.validator.pubkey) {
            return parseInt(validator.index);
        }
    }
}

function uintToBytesBigEndian(x, b) {
    let bytes = [];
    for (let i = 0; i < b; i++) {
        bytes.unshift(x & 255);
        x >>= 8;
    }
    return bytes;
}

const uint64ToBytesBigEndian = (x) => uintToBytesBigEndian(x, 8);
const uint32ToBytesBigEndian = (x) => uintToBytesBigEndian(x, 4);

function computeUpdateMessage(startIndex, count, nonce, chainId, validatorRegistryAddress, version, register) {
    let bytes = [parseInt(version)];
    bytes = bytes.concat(uint64ToBytesBigEndian(chainId));
    bytes = bytes.concat(Array.from(web3.utils.hexToBytes(validatorRegistryAddress)));
    bytes = bytes.concat(uint64ToBytesBigEndian(startIndex));
    bytes = bytes.concat(uint32ToBytesBigEndian(count));
    bytes = bytes.concat(uint32ToBytesBigEndian(nonce));
    bytes = bytes.concat(register ? [1] : [0]);
    return bytes;
}

async function main() {
    const numValidators = parseInt(process.argv[2] || 1);
    const outputDir = process.argv[3] || "./output";

    // Step 1: Generate Validator Keys
    await generateValidatorKeys(numValidators, outputDir);

    // Step 2: Load Validators and Keystores
    const validators = await getValidators(process.env.CL_ENDPOINT);
    console.log("Fetched validator info...");

    const keystoreFilepaths = fs.readdirSync(outputDir + "/validator_keys");
    const keystoreMap = {};

    for (const filename of keystoreFilepaths) {
        if (filename.startsWith("keystore")) {
            const keystorePath = `${outputDir}/validator_keys/${filename}`;
            const [sk, pk] = await loadKeystore(keystorePath, process.env.KEYSTORE_PASSWORD);
            const validatorIndex = getValidatorIndex(pk, validators);
            keystoreMap[validatorIndex] = { sk, pk };
            console.log(`Loaded keystore ${filename}, Index: ${validatorIndex}`);
        }
    }

    // Step 3: Generate Registration Signatures
    const startIndex = 0;
    const endIndex = numValidators;
    const nonce = 0;
    const register = true;

    const message = computeUpdateMessage(
        startIndex,
        endIndex - startIndex,
        nonce,
        process.env.CHAIN_ID,
        process.env.VALIDATOR_REGISTRY_ADDRESS,
        validatorRegistryVersion,
        register
    );

    const sigs = [];
    for (let i = startIndex; i < endIndex; i++) {
        if (!keystoreMap[i]) {
            console.error(`Missing keystore for validator ${i}`);
            process.exit(1);
        }

        const messageHash = web3.utils.hexToBytes(web3.utils.sha3(new Uint8Array(message)));
        const sig = keystoreMap[i].sk.sign(messageHash, dst);
        sigs.push(sig);
    }

    const sig = bls.aggregateSignatures(sigs);
    const messageHex = web3.utils.bytesToHex(message);
    const sigHex = web3.utils.bytesToHex(sig);

    // Save outputs
    fs.writeFileSync(`${outputDir}/validatorInfo.json`, JSON.stringify(keystoreMap));
    fs.writeFileSync(`${outputDir}/signedRegistrations.json`, JSON.stringify({ message: messageHex, signature: sigHex }));

    console.log(`Validator keys and registration data saved to ${outputDir}!`);
}

main().catch(console.error);
