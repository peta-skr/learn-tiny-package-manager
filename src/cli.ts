import yargs from "yargs";
import pm from "./index.js"; // index.tsの無名関数をインポートしている

yargs
  .usage("tiny-pm <command> [args]")
  .version()
  .alias("v", "version")
  .help()
  .alias("h", "help")
  .command(
    "install",
    "Install the dependencies.",
    (argv) => {
      argv.option("production", {
        type: "boolean",
        description: "Install production dependencies only.",
      });
      argv.boolean("save-dev");
      argv.boolean("dev");
      argv.alias("D", "dev");

      return argv;
    },
    pm
  )
  .command(
    "*",
    "Install the dependenvcies",
    (argv) =>
      argv.option("production", {
        type: "boolean",
        description: "Install production dependencies only.",
      }),
    pm
  )
  .parse();
