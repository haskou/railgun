import { execFileSync } from "node:child_process";

export const requiredPackages = [
  "@haskou/ddd-kernel",
  "@haskou/value-objects",
  "@haskou/eslint-config",
] as const;

export type PackageVersions = Record<string, string | undefined>;

export function resolvePackageVersions(): PackageVersions {
  return Object.fromEntries(
    requiredPackages.map((packageName) => [
      packageName,
      npmVersion(packageName),
    ]),
  );
}

export function resolveNodeVersion(): string {
  return npmVersion("node") ?? process.version.replace(/^v/, "");
}

export function pinned(version: string | undefined): string {
  return version ?? "0.0.0";
}

function npmVersion(packageName: string): string | undefined {
  try {
    return execFileSync("npm", ["view", packageName, "version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}
