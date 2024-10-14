"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const index_js_1 = __importDefault(require("./index.js")); // index.tsの無名関数をインポートしている
yargs_1.default
    .usage("tiny-pm <command> [args]")
    .version()
    .alias("v", "version")
    .help()
    .alias("h", "help")
    .command("install", "Install the dependencies.", (argv) => {
    argv.option("production", {
        type: "boolean",
        description: "Install production dependencies only.",
    });
    argv.boolean("save-dev");
    argv.boolean("dev");
    argv.alias("D", "dev");
    return argv;
}, index_js_1.default)
    .command("*", "Install the dependenvcies", (argv) => argv.option("production", {
    type: "boolean",
    description: "Install production dependencies only.",
}), index_js_1.default)
    .parse();
