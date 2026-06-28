import { ChangeType, ReleaseCommit } from "./types";

export type ChangeInference = {
  readonly reason: string;
  readonly type: ChangeType;
};

export function highestBump(commits: Pick<ReleaseCommit, "type">[]): {
  readonly bump: ChangeType;
  readonly warnings: string[];
} {
  const knownTypes = commits
    .map((commit) => commit.type)
    .filter((type) => type !== "unknown");

  if (knownTypes.includes("major")) {
    return { bump: "major", warnings: [] };
  }

  if (knownTypes.includes("minor")) {
    return { bump: "minor", warnings: [] };
  }

  if (knownTypes.includes("patch")) {
    return { bump: "patch", warnings: [] };
  }

  return {
    bump: "patch",
    warnings: [
      "All selected commits are unknown; using patch bump by default.",
    ],
  };
}

export function inferChangeType(
  branches: string[],
  subject: string,
  body: string,
): ChangeInference {
  const branchInference = inferFromBranches(branches);

  if (branchInference.type !== "unknown") {
    return branchInference;
  }

  return inferFromCommitMessage(subject, body);
}

function inferFromBranches(branches: string[]): ChangeInference {
  for (const branch of branches.map(normalizeBranchName)) {
    if (branch.startsWith("break/")) {
      return { reason: `branch ${branch}`, type: "major" };
    }

    if (branch.startsWith("feat/")) {
      return { reason: `branch ${branch}`, type: "minor" };
    }

    if (branch.startsWith("fix/")) {
      return { reason: `branch ${branch}`, type: "patch" };
    }
  }

  return { reason: "no branch metadata found", type: "unknown" };
}

function inferFromCommitMessage(
  subject: string,
  body: string,
): ChangeInference {
  if (
    subject.match(/^[a-z]+(?:\([^)]+\))?!:/) ||
    body.includes("BREAKING CHANGE")
  ) {
    return { reason: "commit message contains breaking change", type: "major" };
  }

  if (subject.startsWith("feat:") || subject.match(/^feat\([^)]+\):/)) {
    return { reason: "commit message feat", type: "minor" };
  }

  if (subject.startsWith("fix:") || subject.match(/^fix\([^)]+\):/)) {
    return { reason: "commit message fix", type: "patch" };
  }

  return {
    reason: "no branch or conventional commit metadata found",
    type: "unknown",
  };
}

function normalizeBranchName(branch: string): string {
  return branch
    .replace(/^remotes\//, "")
    .replace(/^[^/]+\/(break|feat|fix)\//, "$1/");
}
