import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { addReadmeBadge, addReadmeSection, write } from "../filesystem";
import { resolveGithubRepository } from "../githubRepository";
import {
  npmWorkflow,
  releaseBranchesReadmeSection,
} from "../templates/integrationTemplates";
import { resolveNodeVersion } from "../versions";

export function addNpm(root: string, projectName = "railgun"): void {
  const packageName = resolvePackageName(root) ?? projectName;
  const repositoryName = repositoryNameFromPackageName(packageName);
  const nodeMajor = resolveNodeVersion().split(".")[0];
  const githubRepository = resolveGithubRepository(root, repositoryName);
  const badgeUrl = `https://github.com/${githubRepository.owner}/${githubRepository.repository}/actions/workflows/ci.yml`;

  write(root, ".github/workflows/ci.yml", npmWorkflow(nodeMajor));
  addReadmeBadge(root, `[![CI](${badgeUrl}/badge.svg)](${badgeUrl})`);
  addReadmeBadge(
    root,
    `[![npm](https://img.shields.io/npm/v/${packageName}.svg)](https://www.npmjs.com/package/${packageName})`,
  );
  addReadmeSection(root, "Release Branches", releaseBranchesReadmeSection());
  console.log("Added npm workflow.");
}

function resolvePackageName(root: string): string | undefined {
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

function repositoryNameFromPackageName(packageName: string): string {
  const parts = packageName.split("/");

  return parts[parts.length - 1] ?? packageName;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
