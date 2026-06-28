import { ChangeType } from "./types";

export type SemVer = {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
};

const semverPattern = /^v?(\d+)\.(\d+)\.(\d+)$/;

export function compareVersions(left: string, right: string): number {
  const leftVersion = parseSemVer(left);
  const rightVersion = parseSemVer(right);

  if (!leftVersion || !rightVersion) {
    throw new Error(`Invalid SemVer comparison: ${left} ${right}`);
  }

  return (
    leftVersion.major - rightVersion.major ||
    leftVersion.minor - rightVersion.minor ||
    leftVersion.patch - rightVersion.patch
  );
}

export function highestSemVerTag(tags: string[]): string | null {
  return (
    tags
      .filter((tag) => parseSemVer(tag) !== null)
      .sort((left, right) => compareVersions(right, left))[0] ?? null
  );
}

export function isSemVer(value: string): boolean {
  return parseSemVer(value) !== null;
}

export function nextVersion(base: string, bump: ChangeType): string {
  const version = parseSemVer(base);

  if (!version) {
    throw new Error(`Invalid base version: ${base}`);
  }

  if (bump === "major") {
    return `${version.major + 1}.0.0`;
  }

  if (bump === "minor") {
    return `${version.major}.${version.minor + 1}.0`;
  }

  return `${version.major}.${version.minor}.${version.patch + 1}`;
}

export function normalizeVersion(value: string): string {
  const version = parseSemVer(value);

  if (!version) {
    throw new Error(`Invalid SemVer: ${value}`);
  }

  return `${version.major}.${version.minor}.${version.patch}`;
}

export function parseSemVer(value: string): SemVer | null {
  const match = value.match(semverPattern);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function releaseBranch(version: string): string {
  return `release/v${normalizeVersion(version)}`;
}
