import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function repositoryNameFromPackageName(packageName: string): string {
  const parts = packageName.split("/");

  return parts[parts.length - 1] ?? packageName;
}

export function resolvePackageName(root: string): string | undefined {
  const path = join(root, "package.json");

  if (!existsSync(path)) {
    return undefined;
  }

  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  if (!isRecord(parsed) || typeof parsed.name !== "string") {
    return undefined;
  }

  return parsed.name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
