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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const find_up_1 = require("find-up");
const fs_extra_1 = __importDefault(require("fs-extra"));
function default_1(args) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find and read the `package.json`.
        const jsonPath = (yield (0, find_up_1.findUp)("package.json"));
        console.log(jsonPath);
        const root = yield fs_extra_1.default.readJson(jsonPath);
        console.log(root);
        const additionalPackages = args._.slice(1);
        console.log(additionalPackages);
    });
}
