import { addReadmeBadge, addReadmeSection, write } from "../filesystem";
import { resolveGithubRepository } from "../githubRepository";
import {
  repositoryNameFromPackageName,
  resolvePackageName,
} from "../packageMetadata";
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
