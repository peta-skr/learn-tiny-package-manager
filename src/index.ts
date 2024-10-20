import { findUp } from "find-up";
import fs from "fs-extra";
import type { Arguments } from "yargs";
import * as lock from "./lock.js";
import list, { PackageJson } from "./list.js";
import * as log from "./log.js";
import * as utils from "./utils.js";
import install from "./install.js";

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

  await lock.readLock();

  const info = await list(root);

  lock.writeLock();

  log.prepareInstall(
    Object.keys(info.topLevel).length + info.unsatisfied.length
  );

  // Install top level packages.
  await Promise.all(
    Object.entries(info.topLevel).map(([name, { url }]) => install(name, url))
  );

  // Install packages which have conflicts.
  await Promise.all(
    info.unsatisfied.map((item) =>
      install(item.name, item.url, `/node_modules/${item.parent}`)
    )
  );

  beautifyPackageJson(root);

  // Save the `package.json` file.
  fs.writeJson(jsonPath, root, { spaces: 2 });

  // That's all! Everything should be finished if no errors occurred.
}

/**
 * Beautify the `dependencies` field and `devDependencies` field.
 */
function beautifyPackageJson(packageJson: PackageJson) {
  if (packageJson.dependencies) {
    packageJson.dependencies = utils.sortKeys(packageJson.dependencies);
  }

  if (packageJson.devDependencies) {
    packageJson.devDependencies = utils.sortKeys(packageJson.devDependencies);
  }
}
