import fs from "fs";
import loadWeb3 from "web3";
import { decrypt, Keystore } from "@chainsafe/bls-keystore";
import bls from "@chainsafe/bls";
import minimist from "minimist";

const dst = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
const web3 = new loadWeb3(process.env.EL_ENDPOINT);

async function loadKeystore(keystorePath, password) {
  const keystoreRaw = fs.readFileSync(keystorePath).toString();
  const keystore = Keystore.fromObject(JSON.parse(keystoreRaw));
  const pk = '0x' + keystore.pubkey;
  const skBytes = await decrypt(keystore, password);
  const sk = bls.SecretKey.fromBytes(skBytes);
  return [sk, pk];
}

async function getValidatorIndexByPubkey(beaconEndpoint, pk) {
  const response = await fetch(beaconEndpoint + '/eth/v1/beacon/states/head/validators/' + pk);
  if (response.status === 200) {
    return (await response.json()).data.index;
  }
}

function uintToBytesBigEndian(x, b) {
  let bytes = []
  for (let i = 0; i < b; i++) {
    bytes.unshift(x & 255);
    x >>= 8;
  }
  return bytes;
}
const uint64ToBytesBigEndian = (x) => uintToBytesBigEndian(x, 8);
const uint32ToBytesBigEndian = (x) => uintToBytesBigEndian(x, 4);

function computeUpdateMessage(startIndex, count, nonce, chainId, validatorRegistryAddress, version, register) {
  let bytes = [version];
  bytes = bytes.concat(uint64ToBytesBigEndian(chainId));
  bytes = bytes.concat(Array.from(web3.utils.hexToBytes(validatorRegistryAddress)));
  bytes = bytes.concat(uint64ToBytesBigEndian(startIndex));
  if (version === 0) {
      bytes = bytes.concat(uint64ToBytesBigEndian(nonce));
      if (count > 1) {
            console.log("Version 0 validator registration doesn't support registering mutliple validators in a single message.");
            process.exit(1);
      }
  } else if (version === 1) {
      bytes = bytes.concat(uint32ToBytesBigEndian(count));
      bytes = bytes.concat(uint32ToBytesBigEndian(nonce));
  } else {
      console.log('Unsupported registry message version ' + version);
      process.exit(1);
  }
  bytes = bytes.concat(register ? [1] : [0]);
  return bytes;
}

async function main() {
  const argv = minimist(process.argv.slice(2));

  if (argv._.length === 0) {
    console.error('Must pass start validator index.');
    process.exit(1);
  }

  let startIndex = parseInt(argv._[0]);
  let endIndex = startIndex + 1;

  if (argv._.length > 1) {
    endIndex = parseInt(argv._[1]) + 1;
  }

  let nonce = 0;
  if ('nonce' in argv) {
    nonce = parseInt(argv['nonce']);
  }

  let register = true;
  if ('--deregister' in argv) {
    register = false;
  }

  const version = parseInt(process.env.VALIDATOR_REGISTRY_VERSION, 10);

  console.log('Fetching validator info...');

  let validatorInfo = {}
  let validatorSecretKeys = {}

  const keystoreFilepaths = fs.readdirSync("/keystore");
  for (const filename of keystoreFilepaths) {
    if (filename.startsWith('keystore')) {
      const keystorePath = "/keystore/" + filename;
      const keystore = await loadKeystore(keystorePath, process.env.KEYSTORE_PASSWORD)
      const [sk, pk] = keystore;
      const validatorIndex = await getValidatorIndexByPubkey(process.env.CL_ENDPOINT, pk);

      console.log('Loaded keystore ' + filename);
      validatorSecretKeys[validatorIndex] = sk;
      validatorInfo[validatorIndex] = pk;
    }
  }

  let missing = false;
  for (let i = startIndex; i < endIndex; i++) {
    if (!(i in validatorSecretKeys)) {
      console.error('Missing keystore for validator ' + i);
      missing = true;
    }
  }

  if (missing) {
    process.exit(1);
  }

  console.log('Loaded all keystores for indices ' + startIndex + ' up to ' + (endIndex - 1) + '...');

  const count = endIndex - startIndex;
  const message = computeUpdateMessage(startIndex, count, nonce, process.env.CHAIN_ID, process.env.VALIDATOR_REGISTRY_ADDRESS, version, register);
  let sigs = [];

  for (let i = startIndex; i < endIndex; i++) {
    console.log(`Generating v${version} signature for validator ${i}`);

    const messageHash = web3.utils.hexToBytes(web3.utils.sha3(new Uint8Array(message)));
    const sig = validatorSecretKeys[i].sign(messageHash, dst);
    sigs.push(sig);
  }

  let sigHex;
  if (version === 1) {
      console.log('Aggregating signatures...');
      const sig = bls.aggregateSignatures(sigs);
      sigHex = web3.utils.bytesToHex(sig);
  } else if (version === 0) {
      sigHex = sigs[0].toHex();
  }

  const messageHex = web3.utils.bytesToHex(message);
  fs.writeFileSync('/output/validatorInfo.json', JSON.stringify(validatorInfo));
  fs.writeFileSync('/output/signedRegistrations.json', JSON.stringify({'message': messageHex, 'signature': sigHex}));
  console.log("Finished writing output files")
}

await main();
