import { findUp } from "find-up";
import fs from "fs-extra";
import type { Arguments } from "yargs";

export default async function (args: Arguments) {
  // Find and read the `package.json`.
  const jsonPath = (await findUp("package.json"))!;

  const root = await fs.readJson(jsonPath);

  console.log(root);

  const additionalPackages = args._.slice(1);

  console.log(additionalPackages);
  if (additionalPackages.length) {
    if (args["save-dev"] || args.dev) {
      root.devDependencies = root.devDependencies || {};

      additionalPackages.forEach((pkg) => (root.devDependencies[pkg] = ""));
    } else {
      root.dependencies = root.dependencies || {};

      additionalPackages.forEach((pkg) => (root.dependencies[pkg] = ""));
    }
  }

  console.log(root);

  if (args.production) {
    delete root.devDependencies;
  }
}
