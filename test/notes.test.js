"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var EncryptedViewingKey_1 = require("./EncryptedViewingKey");
var expect = require("chai").expect;
require('source-map-support').install();
var utils = require("@aztec/dev-utils");
var noteAccess = require("@aztec/note-access");
var metaDataConstructor = noteAccess.metadata;
var nacl = require("tweetnacl");
var aztec = require("aztec.js");
var dotenv = require("dotenv");
dotenv.config();
var secp256k1 = require("@aztec/secp256k1");
var ZkAssetMintable = artifacts.require("./ZkAssetMintable.sol");
var ACE = artifacts.require("./ACE.sol");
var stripPrependedZeroes = function (str) { return str.replace(/^0{1,}/, ''); };
var Web3 = require('web3');
var toChecksumAddress = require('web3-utils').toChecksumAddress;
var web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
var abiDecoder = require('abi-decoder');
var noteDataTypes = ['bytes32', 'uint256'];
var ADDRESS_LENGTH = 40;
var USER_PUBLIC_KEY_LENGTH = 66;
var EXTENSION_PUBLIC_KEY_LENGTH = 64;
var REAL_VIEWING_KEY_LENGTH = 138;
var VIEWING_KEY_LENGTH = 420;
var METADATA_AZTEC_DATA_LENGTH = 194;
var AZTEC_JS_METADATA_PREFIX_LENGTH = 130;
var AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH = 66;
var DYNAMIC_VAR_CONFIG_LENGTH = 64;
var MIN_BYTES_VAR_LENGTH = 64;
var START_EVENTS_SYNCING_BLOCK = 0;
var metadataConfig = [
    {
        name: 'addresses',
        length: ADDRESS_LENGTH,
        _toString: toChecksumAddress
    },
    {
        name: 'viewingKeys',
        length: VIEWING_KEY_LENGTH
    },
    {
        name: 'appData'
    },
];
var MINT_PROOF = utils.proofs.MINT_PROOF;
var JoinSplitProof = aztec.JoinSplitProof, MintProof = aztec.MintProof;
contract("Private payment", function (accounts) {
    var bob = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_0);
    var sally = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_1);
    var observer = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_2);
    var privatePaymentContract;
    var aceContract;
    var web3ZkAssetContract;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ZkAssetMintable.deployed()];
                case 1:
                    privatePaymentContract = _a.sent();
                    return [4 /*yield*/, ACE.deployed()];
                case 2:
                    aceContract = _a.sent();
                    web3ZkAssetContract = new web3.eth.Contract(privatePaymentContract.abi, privatePaymentContract.address);
                    return [2 /*return*/];
            }
        });
    }); });
    it('[MINT][SENDER] should to able to read note event data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var receipt, logs, createNoteEvent, noteHash, decoded, ephemeralKey, approvedAddressesOffset, fetchedNote;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mintSample(privatePaymentContract, accounts, bob.publicKey, 100, [])];
                case 1:
                    receipt = _a.sent();
                    logs = receipt.logs;
                    createNoteEvent = logs[0];
                    noteHash = createNoteEvent.args.noteHash;
                    expect(createNoteEvent.event).to.equal('CreateNote');
                    console.log("createNoteEvent: " + JSON.stringify(createNoteEvent));
                    console.log("metadata: " + createNoteEvent.args.metadata);
                    decoded = web3.eth.abi.decodeLog(noteDataTypes, createNoteEvent.args.metadata);
                    ephemeralKey = decoded[0];
                    expect(ephemeralKey).to.be.a('string');
                    expect(ephemeralKey).to.have.length(66);
                    approvedAddressesOffset = decoded[1];
                    expect(approvedAddressesOffset).to.be.a('string');
                    console.log("decoded: " + JSON.stringify(decoded));
                    return [4 /*yield*/, aceContract.getNote(privatePaymentContract.address, noteHash)];
                case 2:
                    fetchedNote = _a.sent();
                    console.log("fetched note: " + JSON.stringify(fetchedNote));
                    return [2 /*return*/];
            }
        });
    }); });
    it('[SENDER][NOTE] should be able get note value and key', function () { return __awaiter(void 0, void 0, void 0, function () {
        var noteValue, bobNote1, viewNote, a, k, ephemeralKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    noteValue = 100;
                    return [4 /*yield*/, aztec.note.create(bob.publicKey, noteValue)];
                case 1:
                    bobNote1 = _a.sent();
                    viewNote = bobNote1.getView();
                    console.log("viewNote: " + viewNote);
                    a = viewNote.substr(2, 64);
                    k = viewNote.substr(66, 8);
                    ephemeralKey = viewNote.substr(74, 66);
                    expect(parseInt(k, 16)).to.equal(noteValue);
                    console.log("a : " + parseInt(a, 16) + ", k: " + parseInt(k, 16));
                    console.log("ephemeral key : " + ephemeralKey);
                    return [2 /*return*/];
            }
        });
    }); });
    it('Export Note', function () { return __awaiter(void 0, void 0, void 0, function () {
        var bobNote1, exportNote;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, aztec.note.create(bob.publicKey, 100)];
                case 1:
                    bobNote1 = _a.sent();
                    exportNote = bobNote1.exportNote();
                    console.log("exportNote: " + JSON.stringify(exportNote));
                    return [2 /*return*/];
            }
        });
    }); });
    it.skip('[SENDER] Adds access to third party ', function () { return __awaiter(void 0, void 0, void 0, function () {
        var observerKeyPairCurve25519, observerPubKey, mintNote, metaObj, allowedAccess;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    observerKeyPairCurve25519 = nacl.box.keyPair();
                    observerPubKey = '0x' + Buffer.from(observerKeyPairCurve25519.publicKey).toString('hex');
                    console.log("observerPubKey: " + observerPubKey);
                    return [4 /*yield*/, mintSample(privatePaymentContract, accounts, bob.publicKey, 100, [
                            {
                                address: observer.address,
                                linkedPublicKey: observerPubKey //pub key curve25519 ephemeral 
                            }
                        ])];
                case 1:
                    mintNote = _a.sent();
                    console.log("metadata note : " + mintNote.metaData);
                    metaObj = metaDataConstructor(mintNote.metaData.slice(66 + 2));
                    allowedAccess = metaObj.getAccess(observer.address);
                    console.log("allowedAccess: " + allowedAccess);
                    console.log("metaObj: " + JSON.stringify(metaObj));
                    return [2 /*return*/];
            }
        });
    }); });
    it.only('[THIRD-PARTY] should have access to note with viewing key', function () { return __awaiter(void 0, void 0, void 0, function () {
        var observerKeyPairCurve25519, observerPubKey, bobNote1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    web3ZkAssetContract.events.allEvents()
                        .on('data', function (event) { return __awaiter(void 0, void 0, void 0, function () {
                        var metadata, noteFromEventLog, prefix_metadata_length, noteKeyStore, eventMetadataKeyStore, allowedAccess, encryptedViewingKey, viewingKey;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(event.event === 'CreateNote')) return [3 /*break*/, 2];
                                    console.log("### MINT EVENT ###");
                                    console.log("event : " + JSON.stringify(event));
                                    console.log("### assert ###");
                                    console.log("metadata: " + JSON.stringify(event.returnValues.metadata));
                                    console.log("metadata len: " + event.returnValues.metadata.length);
                                    metadata = event.returnValues.metadata;
                                    return [4 /*yield*/, aztec.note.fromEventLog(metadata.slice(0, 196))];
                                case 1:
                                    noteFromEventLog = _a.sent();
                                    console.log("noteFromEventLog: " + JSON.stringify(noteFromEventLog));
                                    prefix_metadata_length = AZTEC_JS_METADATA_PREFIX_LENGTH + AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH;
                                    noteKeyStore = metadata;
                                    console.log("noteKeyStore: " + noteKeyStore);
                                    eventMetadataKeyStore = metaDataConstructor(noteKeyStore.slice(prefix_metadata_length));
                                    console.log("eventMetadataKeyStore: " + JSON.stringify(eventMetadataKeyStore));
                                    allowedAccess = eventMetadataKeyStore.getAccess(observer.address);
                                    encryptedViewingKey = allowedAccess.viewingKey;
                                    console.log("encryptedViewingKey: " + encryptedViewingKey);
                                    viewingKey = EncryptedViewingKey_1.EncryptedViewingKey.fromEncryptedKey(encryptedViewingKey);
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); })
                        .on('error', console.error);
                    observerKeyPairCurve25519 = nacl.box.keyPair();
                    observerPubKey = '0x' + Buffer.from(observerKeyPairCurve25519.publicKey).toString('hex');
                    console.log("observer : " + JSON.stringify(observer));
                    return [4 /*yield*/, mintSample(privatePaymentContract, accounts, bob.publicKey, 100, [
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
                    ];
                case 1:
                    bobNote1 = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
// returns note
var mintSample = function (contract, accounts, publicKey, value, viewers) { return __awaiter(void 0, void 0, void 0, function () {
    var bobNote1, newMintCounterNote, zeroMintCounterNote, sender, mintedNotes, mintProof, mintData, receipt, viewNote, a, k, ephemeralKey;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, aztec.note.create(publicKey, value, viewers, undefined)];
            case 1:
                bobNote1 = _a.sent();
                return [4 /*yield*/, aztec.note.create(publicKey, value, undefined)];
            case 2:
                newMintCounterNote = _a.sent();
                return [4 /*yield*/, aztec.note.createZeroValueNote()];
            case 3:
                zeroMintCounterNote = _a.sent();
                sender = accounts[0];
                mintedNotes = [bobNote1];
                mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
                mintData = mintProof.encodeABI();
                return [4 /*yield*/, contract.confidentialMint(MINT_PROOF, mintData, {
                        from: accounts[0]
                    })];
            case 4:
                receipt = _a.sent();
                viewNote = bobNote1.getView();
                console.log("viewNote: " + viewNote);
                a = viewNote.substr(2, 64);
                k = viewNote.substr(66, 8);
                ephemeralKey = viewNote.substr(74, 66);
                // console.log(`adding access to : ${JSON.stringify(viewers)}`)
                // viewNote.grantViewAccess(viewers)
                console.log("a : " + parseInt(a, 16) + ", k: " + parseInt(k, 16));
                console.log("ephemeral key : " + ephemeralKey);
                console.log("bobNote: " + JSON.stringify(bobNote1));
                return [2 /*return*/, bobNote1];
        }
    });
}); };
function getAccessNoteMetadata(metadata, address) {
    var addresses = metadata.addresses, viewingKeys = metadata.viewingKeys;
    var idx = addresses.findIndex(function (a) { return a === toChecksumAddress(address); });
    if (idx < 0) {
        return null;
    }
    return {
        address: addresses[idx],
        viewingKey: viewingKeys[idx]
    };
}
/**
 * Decode metaData from string format - the format as it is stored on a note - into
 * an object, according to a passed config.
 *
 * @method decodeMetaDataToObject
 * @param {String} metaDataStr - metaData of an AZTEC note, as a hexadecimal string
 * @param {Array} config - defines the schema of the object to which the metaData will be decoded
 * @param {Number} startOffset - JavaScript number representing the length of any prepended metaData which is
 * not encoded in this note-access package, for example the ephemeralKey associated data
 * @returns {Object} metaDataObj - metaData in object form
 */
function decodeMetaDataToObject(metaDataStr, config, startOffset) {
    if (startOffset === void 0) { startOffset = 0; }
    var formattedMetaDataStr = metaDataStr.startsWith('0x') ? metaDataStr.slice(2) : metaDataStr;
    var offsetOfDynamicDataMapping = [];
    config.forEach(function (_, idx) {
        var startOfVars = MIN_BYTES_VAR_LENGTH * idx;
        var dynamicVars = formattedMetaDataStr.substr(startOfVars, MIN_BYTES_VAR_LENGTH);
        offsetOfDynamicDataMapping.push(2 * parseInt(dynamicVars, 16) - startOffset);
    });
    var metaDataObj = {};
    config.forEach(function (_a, i) {
        var name = _a.name, length = _a.length, _toString = _a._toString;
        var data = [];
        var startOfDynamicData = offsetOfDynamicDataMapping[i];
        var endOfDynamicData = offsetOfDynamicDataMapping[i + 1] !== undefined ? offsetOfDynamicDataMapping[i + 1] : formattedMetaDataStr.length;
        var dataStr = formattedMetaDataStr.substring(startOfDynamicData, endOfDynamicData);
        var lengthOfDynamicData = length !== undefined
            ? Math.max(length, MIN_BYTES_VAR_LENGTH)
            : endOfDynamicData - startOfDynamicData - MIN_BYTES_VAR_LENGTH;
        var numberOfDynamicData = parseInt(dataStr.slice(0, MIN_BYTES_VAR_LENGTH), 10);
        for (var j = 0; j < numberOfDynamicData; j += 1) {
            var dynamicData = dataStr.substr(lengthOfDynamicData * j + MIN_BYTES_VAR_LENGTH, lengthOfDynamicData);
            var formattedData = length !== undefined ? dynamicData.slice(-length) : stripPrependedZeroes(dynamicData);
            if (_toString) {
                formattedData = _toString(formattedData).replace(/^0x/, '');
            }
            data.push("0x" + formattedData);
        }
        var isArrayData = length !== undefined;
        metaDataObj[name] = isArrayData ? data : data[0] || '';
    });
    return metaDataObj;
}
//# sourceMappingURL=notes.test.js.map