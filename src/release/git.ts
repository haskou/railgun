import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { inferChangeType } from "./changeInference";
import { highestSemVerTag, normalizeVersion } from "./semver";
import { ReleaseCommit, VersionInfo } from "./types";

type CherryEntry = {
  readonly hash: string;
  readonly pending: boolean;
};

export function assertGitRepository(root: string): string {
  return git(root, ["rev-parse", "--show-toplevel"]).trim();
}

export function branchExists(root: string, branch: string): boolean {
  return gitSucceeds(root, ["rev-parse", "--verify", "--quiet", branch]);
}

export function commitBelongsToBranch(
  root: string,
  commit: string,
  branch: string,
): boolean {
  return gitSucceeds(root, ["merge-base", "--is-ancestor", commit, branch]);
}

export function commitExists(root: string, commit: string): boolean {
  return gitSucceeds(root, ["cat-file", "-e", `${commit}^{commit}`]);
}

export function currentBranch(root: string): string {
  return git(root, ["branch", "--show-current"]).trim();
}

export function detectDefaultSource(root: string): string {
  if (branchExists(root, "main")) {
    return "main";
  }

  if (branchExists(root, "master")) {
    return "master";
  }

  return currentBranch(root);
}

export function git(root: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function gitSucceeds(root: string, args: string[]): boolean {
  try {
    git(root, args);

    return true;
  } catch {
    return false;
  }
}

export function isValidBranchName(root: string, branch: string): boolean {
  return (
    branch.trim() !== "" &&
    gitSucceeds(root, ["check-ref-format", "--branch", branch])
  );
}

export function latestRelease(root: string, target: string): VersionInfo {
  const tags = git(root, ["tag", "--merged", target])
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const latest = highestSemVerTag(tags);

  return {
    latestRelease: latest,
    latestVersion: latest ? normalizeVersion(latest) : "0.0.0",
    latestVersionSource: latest ? "git-tag" : "none",
    target,
    warnings: [],
  };
}

export function listBranches(root: string): string[] {
  const branches = git(root, [
    "for-each-ref",
    "--format=%(refname:short)",
    "refs/heads",
    "refs/remotes",
  ])
    .split("\n")
    .map((branch) => branch.trim())
    .filter((branch) => branch && !branch.endsWith("/HEAD"));

  return Array.from(new Set(branches)).sort();
}

export function pendingCommits(
  root: string,
  source: string,
  target: string,
): ReleaseCommit[] {
  const entries = gitCherry(root, target, source);
  const commits = entries.map((entry) =>
    commitDetails(root, entry.hash, entry.pending ? "pending" : "present"),
  );

  return commits.sort((left, right) => left.date.localeCompare(right.date));
}

export function releaseBranchExists(root: string, branch: string): boolean {
  if (branchExists(root, `refs/heads/${branch}`)) {
    return true;
  }

  return git(root, [
    "for-each-ref",
    "--format=%(refname:short)",
    "refs/remotes",
  ])
    .split("\n")
    .some((remoteBranch) => remoteBranch.trim().endsWith(`/${branch}`));
}

export function selectedCommits(
  root: string,
  source: string,
  target: string,
  hashes: string[],
): ReleaseCommit[] {
  const sourceOrder = sourceCommitIndexes(root, source, target);
  const pending = new Map(
    pendingCommits(root, source, target)
      .filter((commit) => commit.status === "pending")
      .map((commit) => [commit.hash, commit]),
  );

  return hashes
    .map((hash) => {
      const fullHash = git(root, ["rev-parse", hash]).trim();
      const commit = pending.get(fullHash);

      if (!commit) {
        throw new Error(
          `Commit is not pending from ${source} to ${target}: ${hash}`,
        );
      }

      return {
        ...commit,
        status: "selected" as const,
      };
    })
    .sort(
      (left, right) =>
        (sourceOrder.get(left.hash) ?? 0) - (sourceOrder.get(right.hash) ?? 0),
    );
}

export function withTemporaryWorktree<T>(
  root: string,
  target: string,
  callback: (worktree: string) => T,
): T {
  const worktree = mkdtempSync(join(tmpdir(), "railgun-release-"));

  try {
    git(root, ["worktree", "add", "--detach", worktree, target]);

    return callback(worktree);
  } finally {
    if (existsSync(worktree)) {
      gitSucceeds(root, ["worktree", "remove", "--force", worktree]);
      rmSync(worktree, { force: true, recursive: true });
    }
  }
}

export function cherryPick(worktree: string, commits: ReleaseCommit[]): void {
  for (const commit of commits) {
    try {
      git(worktree, ["cherry-pick", commit.hash]);
    } catch (error) {
      const conflict = conflictError(worktree, commit.hash, error);
      gitSucceeds(worktree, ["cherry-pick", "--abort"]);
      throw conflict;
    }
  }
}

export function createBranch(worktree: string, branch: string): void {
  git(worktree, ["checkout", "-b", branch]);
}

export function commitAll(worktree: string, message: string): void {
  git(worktree, ["add", "."]);
  git(worktree, ["commit", "--allow-empty", "-m", message]);
}

function commitDetails(
  root: string,
  hash: string,
  status: "pending" | "present",
): ReleaseCommit {
  const format = "%H%x1f%h%x1f%an%x1f%aI%x1f%s%x1f%B";
  const [fullHash, shortHash, author, date, subject, body] = git(root, [
    "show",
    "-s",
    `--format=${format}`,
    hash,
  ]).split("\x1f");
  const branches = git(root, [
    "branch",
    "--contains",
    fullHash,
    "--all",
    "--format=%(refname:short)",
  ])
    .split("\n")
    .map((branch) => branch.trim())
    .filter(Boolean);
  const inference = inferChangeType(branches, subject.trim(), body.trim());

  return {
    author: author.trim(),
    body: body.trim(),
    date: date.trim(),
    hash: fullHash.trim(),
    reason: inference.reason,
    shortHash: shortHash.trim(),
    status,
    subject: subject.trim(),
    type: inference.type,
  };
}

function sourceCommitIndexes(
  root: string,
  source: string,
  target: string,
): Map<string, number> {
  const orderedHashes = git(root, [
    "rev-list",
    "--reverse",
    "--topo-order",
    source,
    "--not",
    target,
  ])
    .trim()
    .split("\n")
    .filter(Boolean);

  return new Map(orderedHashes.map((hash, index) => [hash, index]));
}

function conflictError(
  worktree: string,
  failedCommit: string,
  error: unknown,
): Error {
  const conflictedFiles = git(worktree, [
    "diff",
    "--name-only",
    "--diff-filter=U",
  ])
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
  const message = error instanceof Error ? error.message : String(error);

  return Object.assign(new Error(message), {
    code: "CHERRY_PICK_CONFLICT",
    conflictedFiles,
    failedCommit,
  });
}

function gitCherry(
  root: string,
  target: string,
  source: string,
): CherryEntry[] {
  return git(root, ["cherry", "-v", target, source])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      hash: line.slice(2).split(" ")[0],
      pending: line.startsWith("+"),
    }));
}
