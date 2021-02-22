"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install();
var utils = require("@aztec/dev-utils");
var aztec = require("aztec.js");
var dotenv = require("dotenv");
dotenv.config();
var secp256k1 = require("@aztec/secp256k1");
var ZkAssetMintable = artifacts.require("./ZkAssetMintable.sol");
var ACE = artifacts.require("./ACE.sol");
var decodeMetaDataToObject_1 = __importDefault(require("@aztec/note-access/lib/utils/decodeMetaDataToObject"));
var metadata_1 = __importStar(require("@aztec/note-access/lib/config/metadata"));
var MINT_PROOF = utils.proofs.MINT_PROOF;
var JoinSplitProof = aztec.JoinSplitProof, MintProof = aztec.MintProof;
contract("Private payment", function (accounts) {
    var bob = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_0);
    var sally = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_1);
    var observer = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_2);
    var privatePaymentContract;
    var aceContract;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ZkAssetMintable.deployed()];
                case 1:
                    privatePaymentContract = _a.sent();
                    return [4 /*yield*/, ACE.deployed()];
                case 2:
                    aceContract = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it.only("Node 1 ", function () { return __awaiter(void 0, void 0, void 0, function () {
        var bobNote1, newMintCounterNote, zeroMintCounterNote, sender, mintedNotes, mintProof, mintData, receipt, logs, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, aztec.note.create(bob.publicKey, 100)];
                case 1:
                    bobNote1 = _a.sent();
                    console.log("bob: " + JSON.stringify(bobNote1));
                    return [4 /*yield*/, aztec.note.create(bob.publicKey, 100)];
                case 2:
                    newMintCounterNote = _a.sent();
                    return [4 /*yield*/, aztec.note.createZeroValueNote()];
                case 3:
                    zeroMintCounterNote = _a.sent();
                    sender = accounts[0];
                    mintedNotes = [bobNote1];
                    mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
                    mintData = mintProof.encodeABI();
                    return [4 /*yield*/, privatePaymentContract.confidentialMint(MINT_PROOF, mintData, {
                            from: accounts[0]
                        })];
                case 4:
                    receipt = _a.sent();
                    logs = receipt['receipt'].rawLogs;
                    // console.log(`mint result : ${JSON.stringify(receipt)}`)
                    // console.log(`logs: ${JSON.stringify(logs)}`)
                    console.log("Bob minted");
                    console.log("log : " + JSON.stringify(logs[0]));
                    i = 0;
                    logs.forEach(function (log) { return __awaiter(void 0, void 0, void 0, function () {
                        var eventData;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("log[" + i++ + "]  : " + JSON.stringify(log.data));
                                    return [4 /*yield*/, decodeMetaDataToObject_1.default(log.data, metadata_1.default, metadata_1.START_OFFSET)];
                                case 1:
                                    eventData = _a.sent();
                                    console.log("eventData[" + i + "] => " + eventData);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    }); });
    it("Bob should be able to deposit 100 then pay sally 25 by splitting notes he owns", function () { return __awaiter(void 0, void 0, void 0, function () {
        var bobNote1, newMintCounterNote, zeroMintCounterNote, sender, mintedNotes, mintProof, mintData, sallyTaxiFee, bobNote2, sendProofSender, withdrawPublicValue, publicOwner, sendProof, sendProofData, sendProofSignatures;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("asset contract : " + privatePaymentContract.address);
                    console.log("Bob wants to deposit 100");
                    return [4 /*yield*/, aztec.note.create(bob.publicKey, 100)];
                case 1:
                    bobNote1 = _a.sent();
                    return [4 /*yield*/, aztec.note.create(bob.publicKey, 100)];
                case 2:
                    newMintCounterNote = _a.sent();
                    return [4 /*yield*/, aztec.note.createZeroValueNote()];
                case 3:
                    zeroMintCounterNote = _a.sent();
                    sender = accounts[0];
                    mintedNotes = [bobNote1];
                    mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
                    mintData = mintProof.encodeABI();
                    return [4 /*yield*/, privatePaymentContract.confidentialMint(MINT_PROOF, mintData, {
                            from: accounts[0]
                        })];
                case 4:
                    _a.sent();
                    console.log("completed mint proof");
                    console.log("Bob successfully deposited 100");
                    // bob needs to pay sally for a taxi
                    // the taxi is 25
                    // if bob pays with his note worth 100 he requires 75 change
                    console.log("Bob takes a taxi, Sally is the driver");
                    return [4 /*yield*/, aztec.note.create(sally.publicKey, 25)];
                case 5:
                    sallyTaxiFee = _a.sent();
                    console.log("The fare comes to 25");
                    return [4 /*yield*/, aztec.note.create(bob.publicKey, 75)];
                case 6:
                    bobNote2 = _a.sent();
                    sendProofSender = accounts[0];
                    withdrawPublicValue = 0;
                    publicOwner = accounts[0];
                    sendProof = new JoinSplitProof(mintedNotes, [sallyTaxiFee, bobNote2], sendProofSender, withdrawPublicValue, publicOwner);
                    sendProofData = sendProof.encodeABI(privatePaymentContract.address);
                    sendProofSignatures = sendProof.constructSignatures(privatePaymentContract.address, [bob]);
                    return [4 /*yield*/, privatePaymentContract.methods["confidentialTransfer(bytes,bytes)"](sendProofData, sendProofSignatures, {
                            from: accounts[0]
                        })];
                case 7:
                    _a.sent();
                    console.log("Bob paid sally 25 for the taxi and gets 75 back");
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=notes.test.js.map