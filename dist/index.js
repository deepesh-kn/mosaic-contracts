"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contracts = __importStar(require("./contract_build/contracts.json"));
exports.contracts = contracts;
const Interacts_1 = __importDefault(require("./interacts/Interacts"));
exports.interacts = Interacts_1.default;
const deployers = __importStar(require("./deployers/Deployer"));
exports.deployers = deployers;
//# sourceMappingURL=index.js.map