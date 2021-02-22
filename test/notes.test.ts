const { expect } = require("chai")
const ethers = require('ethers')
const tweetNaclUtils = require("tweetnacl-util")

require('source-map-support').install();
const utils = require("@aztec/dev-utils");
const noteAccess = require("@aztec/note-access")
const { metadata: metaDataConstructor } = noteAccess

const nacl = require("tweetnacl")

const aztec = require("aztec.js");
const dotenv = require("dotenv");
dotenv.config();
const secp256k1 = require("@aztec/secp256k1");

const ZkAssetMintable = artifacts.require("./ZkAssetMintable.sol");
const ACE = artifacts.require("./ACE.sol")
const stripPrependedZeroes = (str) => str.replace(/^0{1,}/, '');

const Web3 = require('web3')
const { toChecksumAddress } = require('web3-utils')
const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"))

const abiDecoder = require('abi-decoder')
const noteDataTypes = ['bytes32', 'uint256']

const ADDRESS_LENGTH = 40;

const USER_PUBLIC_KEY_LENGTH = 66;
const EXTENSION_PUBLIC_KEY_LENGTH = 64;

const REAL_VIEWING_KEY_LENGTH = 138;
const VIEWING_KEY_LENGTH = 420;

const METADATA_AZTEC_DATA_LENGTH = 194;
const AZTEC_JS_METADATA_PREFIX_LENGTH = 130;
const AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH = 66;

const DYNAMIC_VAR_CONFIG_LENGTH = 64;
const MIN_BYTES_VAR_LENGTH = 64;

const START_EVENTS_SYNCING_BLOCK = 0;
const metadataConfig = [
  {
    name: 'addresses',
    length: ADDRESS_LENGTH,
    _toString: toChecksumAddress,
  },
  {
    name: 'viewingKeys',
    length: VIEWING_KEY_LENGTH,
  },
  {
    name: 'appData',
  },
]

const {
  proofs: { MINT_PROOF }
} = utils;

const { JoinSplitProof, MintProof } = aztec;

contract("Private payment", accounts => {
  const bob = secp256k1.accountFromPrivateKey(
    process.env.GANACHE_TESTING_ACCOUNT_0
  );
  const sally = secp256k1.accountFromPrivateKey(
    process.env.GANACHE_TESTING_ACCOUNT_1
  );

  const observer = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_2)

  let privatePaymentContract;
  let aceContract;
  let web3ZkAssetContract

  beforeEach(async () => {
    privatePaymentContract = await ZkAssetMintable.deployed();
    aceContract = await ACE.deployed()

    web3ZkAssetContract = new web3.eth.Contract(privatePaymentContract.abi, privatePaymentContract.address)
  });

  it('[MINT][SENDER] should to able to read note event data', async () => {
    const receipt = await mintSample(privatePaymentContract, accounts, bob.publicKey, 100, [])
    const logs = receipt.logs
    const createNoteEvent = logs[0]
    const noteHash = createNoteEvent.args.noteHash
    expect(createNoteEvent.event).to.equal('CreateNote')

    console.log(`createNoteEvent: ${JSON.stringify(createNoteEvent)}`)
    console.log(`metadata: ${createNoteEvent.args.metadata}`)
    const decoded = web3.eth.abi.decodeLog(noteDataTypes, createNoteEvent.args.metadata)

    const ephemeralKey = decoded[0]
    expect(ephemeralKey).to.be.a('string')
    expect(ephemeralKey).to.have.length(66)

    const approvedAddressesOffset = decoded[1]
    expect(approvedAddressesOffset).to.be.a('string')

    console.log(`decoded: ${JSON.stringify(decoded)}`)

    const fetchedNote = await aceContract.getNote(privatePaymentContract.address, noteHash)
    console.log(`fetched note: ${JSON.stringify(fetchedNote)}`)

    // const encryptedViewKeysOffset = decoded[2]
  })

  it('[SENDER][NOTE] should be able get note value and key', async () => {
    const noteValue = 100
    const bobNote1 = await aztec.note.create(bob.publicKey, noteValue);
    const viewNote = bobNote1.getView()

    console.log(`viewNote: ${viewNote}`)
    const a = viewNote.substr(2, 64)
    const k = viewNote.substr(66, 8)
    const ephemeralKey = viewNote.substr(74, 66)

    expect(parseInt(k, 16)).to.equal(noteValue)

    console.log(`a : ${parseInt(a, 16)}, k: ${parseInt(k, 16)}`)
    console.log(`ephemeral key : ${ephemeralKey}`)
  })

  it('Export Note', async () => {
    const bobNote1 = await aztec.note.create(bob.publicKey, 100);
    const exportNote = bobNote1.exportNote()

    console.log(`exportNote: ${JSON.stringify(exportNote)}`)
  })

  it.skip('[SENDER] Adds access to third party ', async () => {
    // const web3ZkAssetContract = new web3.eth.Contract(privatePaymentContract.abi, privatePaymentContract.address)

    //  curve25519 pair
    const observerKeyPairCurve25519 = nacl.box.keyPair()
    const observerPubKey = '0x' + Buffer.from(observerKeyPairCurve25519.publicKey).toString('hex')
    console.log(`observerPubKey: ${observerPubKey}`)

    const mintNote = await mintSample(privatePaymentContract, accounts, bob.publicKey, 100, [
      {
        address: observer.address, //eth addr
        linkedPublicKey: observerPubKey //pub key curve25519 ephemeral 
      }
    ])

    console.log(`metadata note : ${mintNote.metaData}`)

    const metaObj = metaDataConstructor(
      mintNote.metaData.slice(
        66 + 2
      )
    )

    const allowedAccess = metaObj.getAccess(observer.address)
    console.log(`allowedAccess: ${allowedAccess}`)


    console.log(`metaObj: ${JSON.stringify(metaObj)}`)
  })

  it.only('[THIRD-PARTY] should have access to note with viewing key', async () => {
    web3ZkAssetContract.events.allEvents()
      .on('data', async (event) => {
        if (event.event === 'CreateNote') {
          const metadata = event.returnValues.metadata

          const noteFromEventLog = await aztec.note.fromEventLog(metadata.slice(0, 196))
          console.log(`noteFromEventLog: ${JSON.stringify(noteFromEventLog)}`)

          const prefix_metadata_length = AZTEC_JS_METADATA_PREFIX_LENGTH + AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH

          const noteKeyStore = metadata

          const eventMetadataKeyStore = metaDataConstructor(
            noteKeyStore.slice(prefix_metadata_length)
          )
          console.log(`eventMetadataKeyStore: ${JSON.stringify(eventMetadataKeyStore)}`)

          const allowedAccess = eventMetadataKeyStore.getAccess(observer.address)
          const encryptedViewingKey = allowedAccess.viewingKey
          console.log(`encryptedViewingKey: ${encryptedViewingKey}, len: ${encryptedViewingKey.length}`)

          const NonceLength = 48 + 2 // + 2 for 0x prefix
          const EphemeralPublicKeyLength = 64
          const ViewKey = {
            nonce: encryptedViewingKey.slice(0, NonceLength),
            ephemeralPublicKey: `0x${encryptedViewingKey.slice(NonceLength, NonceLength + EphemeralPublicKeyLength)}`,
            chiperText: `0x${encryptedViewingKey.slice(NonceLength + EphemeralPublicKeyLength)}`
          }

          const decryptedViewingKey = decrypt(observerKeyPairCurve25519.secretKey, ViewKey.nonce, ViewKey.ephemeralPublicKey, ViewKey.chiperText)
          console.log(`decryptedViewingKey: ${decryptedViewingKey}`)

          const decryptedNote = await aztec.note.fromViewKey(decryptedViewingKey)
          console.log(decryptedNote)
          expect(decryptedNote.k.toNumber()).to.equal(100)
          console.log(`decrypted note value : ${decryptedNote.k.toNumber()}`)
          

          // const accessObj = getAccessNoteMetadata(metaObj, observer.address)
          // console.log(`accessObj : ${JSON.stringify(accessObj)}`)
        }
      })
      .on('error', console.error);

    const observerKeyPairCurve25519 = nacl.box.keyPair()
    const observerPubKey = '0x' + Buffer.from(observerKeyPairCurve25519.publicKey).toString('hex')

    console.log(`observer : ${JSON.stringify(observer)}`)

    const bobNote1 = await mintSample(privatePaymentContract, accounts, bob.publicKey, 100, [
      {
        address: observer.address,
        linkedPublicKey: observerPubKey
      }
    ])

    // console.log(`###################`)
    // console.log(`minted note : ${JSON.stringify(bobNote1)}`)

    // console.log(`##########################################################`)
    // const view = bobNote1.getView()

    // const derived = await aztec.note.fromViewKey(view)
    // console.log(`derived: ${JSON.stringify(derived)}`)


    // const metaDataPrefix = bobNote1.metaData.slice(
    //   0,
    //   AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH + 2
    //  )

    // console.log(`metaDataPrefix: ${metaDataPrefix}`)

    // const newMetaData =
    //   metaDataPrefix + bobNote1.exportMetaData().slice(2)
    // console.log(`newMetaData: ${newMetaData}`)

    // const prefix_metadata_length = AZTEC_JS_METADATA_PREFIX_LENGTH + AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH

    // const metaObj = metaDataConstructor(
    //   newMetaData.slice(
    //     prefix_metadata_length
    //   )
    // )

    // console.log(`metaObj: ${JSON.stringify(metaObj)}`)
  })
});

// returns note
const mintSample = async (contract, accounts, publicKey, value, viewers) => {
  const bobNote1 = await aztec.note.create(publicKey, value, viewers, undefined);
  const newMintCounterNote = await aztec.note.create(publicKey, value, undefined);
  const zeroMintCounterNote = await aztec.note.createZeroValueNote();
  const sender = accounts[0];
  const mintedNotes = [bobNote1];

  const mintProof = new MintProof(
    zeroMintCounterNote,
    newMintCounterNote,
    mintedNotes,
    sender
  );

  const mintData = mintProof.encodeABI();

  const receipt = await contract.confidentialMint(MINT_PROOF, mintData, {
    from: accounts[0]
  })

  const viewNote = bobNote1.getView()
  console.log(`viewNote: ${viewNote}`)
  const a = viewNote.substr(2, 64)
  const k = viewNote.substr(66, 8)
  const ephemeralKey = viewNote.substr(74, 66)

  // console.log(`adding access to : ${JSON.stringify(viewers)}`)
  // viewNote.grantViewAccess(viewers)

  console.log(`a : ${parseInt(a, 16)}, k: ${parseInt(k, 16)}`)
  console.log(`ephemeral key : ${ephemeralKey}`)

  console.log(`bobNote: ${JSON.stringify(bobNote1)}`)

  return bobNote1
}

function getAccessNoteMetadata(metadata, address) {
  const { addresses, viewingKeys } = metadata;

  const idx = addresses.findIndex((a) => a === toChecksumAddress(address));
  if (idx < 0) {
    return null;
  }

  return {
    address: addresses[idx],
    viewingKey: viewingKeys[idx],
  };
}

function decrypt(receiverPrivateKeyUint8Array, nonce, ephemeralPublicKey, cipherText) {
  let decryptedMessage
  try {
    const nonceUint8Array = ethers.utils.arrayify(nonce)
    const ephemeralPublicKeyUint8Array = ethers.utils.arrayify(ephemeralPublicKey)
    const cipherTextUint8Array = ethers.utils.arrayify(cipherText)

    decryptedMessage = nacl.box.open(
      cipherTextUint8Array,
      nonceUint8Array,
      ephemeralPublicKeyUint8Array,
      receiverPrivateKeyUint8Array
    )
  } catch (err) {
    throw Error(`Failed to decrypt viewing key: ${err.message}`)
  }

  if (!decryptedMessage) {
    throw Error(`Failed to decrypt viewing key with private key.`)
  }
  this._viewingKey = "0x" + tweetNaclUtils.encodeUTF8(decryptedMessage)
  return this._viewingKey
}
