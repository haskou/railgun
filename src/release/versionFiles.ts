import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type VersionUpdateResult = {
  readonly changedFiles: string[];
  readonly warnings: string[];
};

type JsonObject = Record<string, unknown>;

export function updateVersionFiles(
  root: string,
  version: string,
): VersionUpdateResult {
  const changedFiles: string[] = [];
  const warnings: string[] = [];

  updatePackageJson(root, version, changedFiles);
  updateLockFile(root, "package-lock.json", version, changedFiles, warnings);
  updateLockFile(root, "npm-shrinkwrap.json", version, changedFiles, warnings);

  return { changedFiles, warnings };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(path: string): JsonObject | undefined {
  if (!existsSync(path)) {
    return undefined;
  }

  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  if (!isJsonObject(parsed)) {
    return undefined;
  }

  return parsed;
}

function updateLockFile(
  root: string,
  filename: string,
  version: string,
  changedFiles: string[],
  warnings: string[],
): void {
  const path = join(root, filename);
  const json = readJson(path);

  if (!json) {
    return;
  }

  json.version = version;

  if (isJsonObject(json.packages) && isJsonObject(json.packages[""])) {
    json.packages[""].version = version;
  } else {
    warnings.push(`Could not safely update root package entry in ${filename}.`);
  }

  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
  changedFiles.push(filename);
}

function updatePackageJson(
  root: string,
  version: string,
  changedFiles: string[],
): void {
  const path = join(root, "package.json");
  const json = readJson(path);

  if (!json) {
    return;
  }

  json.version = version;
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
  changedFiles.push("package.json");
}
