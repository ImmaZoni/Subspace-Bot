/*
  Simple connection interface to the Subspace Network
  check() function will check that the following are true:
  - Valid ED25519 Address
  - Valid Signature
  - Account has a balance of more than 0
*/
const { hexToU8a, isHex } = require("@polkadot/util");
const {
    cryptoWaitReady,
    decodeAddress,
    encodeAddress,
    signatureVerify,
} = require("@polkadot/util-crypto");
const { u8aToHex } = require("@polkadot/util");
const { ApiPromise, WsProvider } = require("@polkadot/api");

// Define Network Connect Function
async function connect() {
  try {
    const provider = new WsProvider(process.env.WS_URL);
    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });

    // Retrieve the chain & node information information via rpc calls
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]);

    console.log(
      `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
    );

    return api;
  } catch (error) {
    throw new Error('Unable to connect to the network');
  }
}


// Define Valid Address Function
async function isValidAddress(address) {
  try {
    encodeAddress(
      isHex(address) ? hexToU8a(address) : decodeAddress(address)
    );
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// Define Valid Signature Function
async function isValidSignature(message, signature, address) {
  const publicKey = decodeAddress(address);
  const hexPublicKey = u8aToHex(publicKey);
  return signatureVerify(message, signature, hexPublicKey).isValid;
}

async function check(message, signature, address) {
  //Verify Address
  const validAddress = await isValidAddress(address);
  console.log(address);
  if (!validAddress) {
    throw new Error('Invalid address');
  }

  //Verify Signature
  await cryptoWaitReady();
  const validSignature = await isValidSignature(message, signature, address);
  if (!validSignature) {
    throw new Error('Valid Address, but Invalid signature!');
  }

  //Check Balance
  const api = await connect();
  let { data: { free: balance } } = await api.query.system.account(address);
  if (balance <= 0) {
    await api.disconnect().then(console.log('Network Disconnected'));
    throw new Error('Valid Address & Valid Signature but Insufficient balance!');
  }

  await api.disconnect().then(console.log('Network Disconnected'));
  return true;
}

module.exports = check;