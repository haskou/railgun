import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export type PackageJson = Record<string, unknown> & {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export function addReadmeBadge(root: string, badge: string): void {
  const path = join(root, "README.md");
  const current = existsSync(path) ? readFileSync(path, "utf8") : "# Project\n";

  if (current.includes(badge)) {
    return;
  }

  writeFileSync(path, `${badge}\n${current}`);
}

export function addReadmeSection(
  root: string,
  title: string,
  content: string,
): void {
  const path = join(root, "README.md");
  const current = existsSync(path) ? readFileSync(path, "utf8") : "# Project\n";

  if (current.includes(`## ${title}`)) {
    return;
  }

  writeFileSync(path, `${current.trimEnd()}\n\n${content.trim()}\n`);
}

export function mutatePackage(
  root: string,
  mutate: (pkg: PackageJson) => PackageJson,
): void {
  const path = join(root, "package.json");
  const parsed: unknown = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf8"))
    : {};
  const pkg = isPackageJson(parsed) ? parsed : {};

  writeFileSync(path, `${JSON.stringify(mutate(pkg), null, 2)}\n`);
}

function isPackageJson(value: unknown): value is PackageJson {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function writeJson(root: string, path: string, value: unknown): void {
  write(root, path, `${JSON.stringify(value, null, 2)}\n`);
}

export function write(root: string, path: string, content: string): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
  formatTypeScript(path, absolute);
  console.log(`write ${relative(root, absolute)}`);
}

function formatTypeScript(path: string, absolute: string): void {
  if (!path.endsWith(".ts")) {
    return;
  }

  try {
    const prettier = require.resolve("prettier/bin/prettier.cjs");
    execFileSync(process.execPath, [prettier, "--write", absolute], {
      stdio: "ignore",
    });
  } catch {
    return;
  }
}
