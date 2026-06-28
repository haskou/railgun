import { addReadmeBadge, write } from "../filesystem";
import { resolveGithubRepository } from "../githubRepository";
import {
  repositoryNameFromPackageName,
  resolvePackageName,
} from "../packageMetadata";
import { dockerWorkflow } from "../templates/integrationTemplates";

export function addDockerCi(root: string, projectName = "railgun"): void {
  const packageName = resolvePackageName(root) ?? projectName;
  const repositoryName = repositoryNameFromPackageName(packageName);
  const githubRepository = resolveGithubRepository(root, repositoryName);
  const badgeUrl = `https://github.com/${githubRepository.owner}/${githubRepository.repository}/actions/workflows/docker.yml`;

  write(root, ".github/workflows/docker.yml", dockerWorkflow());
  addReadmeBadge(root, `[![Docker](${badgeUrl}/badge.svg)](${badgeUrl})`);
  console.log("Added Docker CI workflow.");
}
