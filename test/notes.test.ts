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
const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"))

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

  const observerWithNoAccess = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_3)

  // Curve25519 Keys
  // Observer needs to remember this, per note
  const observerKeyPairCurve25519 = nacl.box.keyPair()
  const observerCurve25519PubKey = '0x' + Buffer.from(observerKeyPairCurve25519.publicKey).toString('hex')

  let privatePaymentContract;
  let aceContract;
  let web3ZkAssetContract

  let noteEventMinted

  const noteValue = 100
  let mintedNote

  // Deploys, gives access to note, listens to event of the mint so that we can run the tests on independently
  before(done => {
    if (!privatePaymentContract) {
      ZkAssetMintable.deployed().then(contract => {
        privatePaymentContract = contract
        ACE.deployed().then(contract => {
          aceContract = contract
          web3ZkAssetContract = web3ZkAssetContract ? web3ZkAssetContract : new web3.eth.Contract(privatePaymentContract.abi, privatePaymentContract.address)

          web3ZkAssetContract.events.allEvents()
            .on('data', (event) => {
              if (event.event === 'CreateNote') {
                noteEventMinted = event

              }
            }).on('error', console.error)

          // [IMPORTANT]
          // Key Exchange between Observer and Minter needed
          // Minter needs to know what Curve25519 key to link to the note so that it can be decrypted
          //only by the observer
          const observers = [
            {
              address: observer.address,
              linkedPublicKey: observerCurve25519PubKey
            }
          ]

          mintNote(privatePaymentContract, accounts, bob.publicKey, noteValue, observers).then(note => {
            mintedNote = note
            done()
          })
        })
      })
    }

  })

  it('A Note was minted!', async () => {
    expect(mintedNote).to.not.equal(undefined)
  })

  it('Should be able to rebuild note only from event / public data', async () => {
    const metadata = noteEventMinted.returnValues.metadata
    // Only 196 first chars (including 0x); the rest of metadata is discarded here
    const noteFromEventLog = await aztec.note.fromEventLog(metadata.slice(0, 0xc4))

    // x & y comparing
    expect(noteFromEventLog.sigma[0]).to.equal(mintedNote.sigma[0])
    expect(noteFromEventLog.sigma[1]).to.equal(mintedNote.sigma[1])

    expect(noteFromEventLog.gamma[0]).to.equal(mintedNote.gamma[0])
    expect(noteFromEventLog.gamma[1]).to.equal(mintedNote.gamma[1])

    // Sigma & Gamma are points on a bn128 ecc curve that point to the noteHash and NoteValue
  })

  it('Should NOT be able to derive a (noteHash) & k (quantity) from just a note event emitted', async () => {
    const metadata = noteEventMinted.returnValues.metadata
    // Only 196 first chars (including 0x); the rest of metadata is discarded here
    const noteFromEventLog = await aztec.note.fromEventLog(metadata.slice(0, 0xc4))
    const viewNote = noteFromEventLog.getView()

    const a = viewNote.substr(2, 64)
    const k = viewNote.substr(66, 8)
    const ephemeralKey = viewNote.substr(74, 66)

    expect(a).to.equal('')
    expect(k).to.equal('')
    expect(ephemeralKey).to.be.a('string')
    expect(ephemeralKey).to.have.lengthOf(0)
  })

  it('As an observer with access, i should have access to note with viewing key ', async () => {
    const metadata = noteEventMinted.returnValues.metadata
    const noteFromEventLog = await aztec.note.fromEventLog(metadata.slice(0, 0xc4))

    // the rest
    const eventMetadataKeyStore = metaDataConstructor(metadata.slice(0xc4))

    const allowedAccess = eventMetadataKeyStore.getAccess(observer.address)
    const encryptedViewingKey = allowedAccess.viewingKey
    const ViewKey = decodeSecretBoxFrom(encryptedViewingKey)

    const decryptedViewingKey = decrypt(observerKeyPairCurve25519.secretKey, ViewKey.nonce, ViewKey.ephemeralPublicKey, ViewKey.chiperText)

    const decryptedNote = await aztec.note.fromViewKey(decryptedViewingKey)
    expect(decryptedNote.k.toNumber()).to.equal(noteValue)
  })

  it('As an observer with NO access, i should have access to note with viewing key ', async () => {
    const metadata = noteEventMinted.returnValues.metadata
    const noteFromEventLog = await aztec.note.fromEventLog(metadata.slice(0, 0xc4))

    // the rest
    const eventMetadataKeyStore = metaDataConstructor(metadata.slice(0xc4))

    const allowedAccess = eventMetadataKeyStore.getAccess(observerWithNoAccess.address)
    expect(allowedAccess).to.equal(null)
  })

  it('Should be able to find the owner of the note', async() => {
    const owner = noteEventMinted.returnValues.owner

    const metadata = noteEventMinted.returnValues.metadata
    const noteFromEventLog = await aztec.note.fromEventLog(metadata.slice(0, 0xc4))
    expect(noteFromEventLog.owner).to.equal('0x') // hmm? Why

    expect(owner).to.equal(bob.address)
  })
})

// simply mints and returns note
/**
 * 
 * @param contract 
 * @param accounts 
 * @param publicKey 
 * @param value 
 * @param viewers - map who etherem address => ephemeral 25519 pub key which has access (by generating the symmetric key offline) 
 */
const mintNote = async (contract, accounts, publicKey, value, viewers) => {
  const bobNote = await aztec.note.create(publicKey, value, viewers, undefined);
  const newMintCounterNote = await aztec.note.create(publicKey, value, undefined);
  const zeroMintCounterNote = await aztec.note.createZeroValueNote();
  const sender = accounts[0];
  const mintedNotes = [bobNote];

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

  return bobNote
}

/**
 * 
 * @param viewingKey - This is a Curve25519 boxed payload which includes the necessary params to decrypt, if ECDH
 * can be performed from the same 25519 linkedPubKey when access was given to a note. 
 * 
 * The encrypted chiper text is the ECDH secret, which is a symmetric encryption / decription key. THAT IS THE ACTUAL VIEWING KEY
 */
function decodeSecretBoxFrom(viewingKey) {
  //https://github.com/dchest/tweetnacl-js/blob/master/README.md#constants
  /**
   * nacl.box.publicKeyLength = 32
      Length of public key in bytes.

      nacl.box.secretKeyLength = 32
      Length of secret key in bytes.

      nacl.box.sharedKeyLength = 32
      Length of precomputed shared key in bytes.

      nacl.box.nonceLength = 24
      Length of nonce in bytes.

      nacl.box.overheadLength = 16
      Length of overhead added to box compared to original message.
   * 
   * 
   */
  // 24 bytes * 2 (2 char per byte in a string) + 2 for 0x prefix
  const nonceLength = 24 * 2 + 2 


   // 32 bytes * 2 (2 char per byte)
  const publicKey25519Length = 32 * 2

  // Counter part generated in @aztec/note-access/src/crypto/encryptMessage.js
  return {
    nonce: viewingKey.slice(0, nonceLength),
    ephemeralPublicKey: '0x' + `${viewingKey.slice(nonceLength, nonceLength + publicKey25519Length)}`,
    chiperText: '0x' + `${viewingKey.slice(nonceLength + publicKey25519Length)}`
  }
}

//
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

  return "0x" + tweetNaclUtils.encodeUTF8(decryptedMessage)
}
