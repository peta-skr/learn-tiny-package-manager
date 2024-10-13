import { findUp } from "find-up";
import fs from "fs-extra";
import yargs from "yargs";

export default async function (args: yargs.Arguments) {
  // Find and read the `package.json`.
  const jsonPath = (await findUp("package.json"))!;
  console.log(jsonPath);

  const root = await fs.readJson(jsonPath);
  console.log(root);

  const additionalPackages = args._.slice(1);

  console.log(additionalPackages);
}
