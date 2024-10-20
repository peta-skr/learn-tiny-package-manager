import * as semver from "semver";
import * as lock from "./lock.js";
import { logResolving, prepareInstall, tickInstalling } from "./log.js";
import resolve from "./resolve.js";

interface DependenciesMap {
  [dependency: string]: string;
}

type DependencyStack = Array<{
  name: string;
  version: string;
  dependencies: { [dep: string]: string };
}>;

export interface PackageJson {
  dependencies?: DependenciesMap;
  devDependencies?: DependenciesMap;
}

const topLevel: {
  [name: string]: { url: string; version: string };
} = Object.create(null);

const unsatisfied: Array<{ name: string; parent: string; url: string }> = [];

async function collectDeps(
  name: string,
  constraint: string,
  stack: DependencyStack = []
) {
  const fromLock = lock.getItem(name, constraint);

  const manifest = fromLock || (await resolve(name));

  logResolving(name);

  const versions = Object.keys(manifest);
  const matched = constraint
    ? semver.maxSatisfying(versions, constraint)
    : versions[versions.length - 1];
  if (!matched) {
    throw new Error("Cannot resolve suitable package.");
  }

  const matchedManifest = manifest[matched]!;

  if (!topLevel[name]) {
    topLevel[name] = { url: matchedManifest.dist.tarball, version: matched };
  } else if (semver.satisfies(topLevel[name]!.version, constraint)) {
    const conflictIndex = checkStackDependencies(name, matched, stack);
    if (conflictIndex === -1) {
      return;
    }

    unsatisfied.push({
      name,
      parent: stack
        .map(({ name }) => name)
        .slice(conflictIndex - 2)
        .join("/node_modules/"),
      url: matchedManifest.dist.tarball,
    });
  } else {
    unsatisfied.push({
      name,
      parent: stack.at(-1)!.name,
      url: matchedManifest.dist.tarball,
    });
  }

  const dependencies = matchedManifest.dependencies ?? {};

  // Save the manifest to the new lock.
  lock.updateOrCreate(`${name}@${constraint}`, {
    version: matched,
    url: matchedManifest.dist.tarball,
    shasum: matchedManifest.dist.shasum,
    dependencies,
  });

  if (dependencies) {
    stack.push({
      name,
      version: matched,
      dependencies,
    });
    await Promise.all(
      Object.entries(dependencies)
        // The filter below is to prevent dependency circulation
        .filter(([dep, range]) => !hasCirculation(dep, range, stack))
        .map(([dep, range]) => collectDeps(dep, range, stack.slice()))
    );
    stack.pop();
  }
  if (!constraint) {
    return { name, version: `^${matched}` };
  }
}

function checkStackDependencies(
  name: string,
  version: string,
  stack: DependencyStack
) {
  return stack.findIndex(({ dependencies }) => {
    const semverRange = dependencies[name];
    /*
     * If this package is not as a dependency of another package,
     * this is safe and we just return `true`.
     */
    if (!semverRange) {
      return true;
    }

    // Semantic version checking.
    return semver.satisfies(version, semverRange);
  });
}

/**
 * This function is to check if there is dependency circulation.
 *
 * If a package is existed in the stack and it satisfy the semantic version,
 * it turns out that there is dependency circulation.
 */
function hasCirculation(name: string, range: string, stack: DependencyStack) {
  return stack.some(
    (item) => item.name === name && semver.satisfies(item.version, range)
  );
}

/**
 * To simplify this guide,
 * We intend to support `dependencies` and `devDependencies` fields only.
 */
export default async function (rootManifest: PackageJson) {
  /*
   * For both production dependencies and development dependencies,
   * if the package name and the semantic version are returned,
   * we should add them to the `package.json` file.
   * This is necessary when adding new packages.
   */

  // Process production dependencies
  if (rootManifest.dependencies) {
    (
      await Promise.all(
        Object.entries(rootManifest.dependencies).map((pair) =>
          collectDeps(...pair)
        )
      )
    )
      .filter(Boolean)
      .forEach(
        (item) => (rootManifest.dependencies![item!.name] = item!.version)
      );
  }

  // Process development dependencies
  if (rootManifest.devDependencies) {
    (
      await Promise.all(
        Object.entries(rootManifest.devDependencies).map((pair) =>
          collectDeps(...pair)
        )
      )
    )
      .filter(Boolean)
      .forEach(
        (item) => (rootManifest.devDependencies![item!.name] = item!.version)
      );
  }

  return { topLevel, unsatisfied };
}
