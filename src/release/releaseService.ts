import { highestBump } from "./changeInference";
import {
  assertGitRepository,
  branchExists,
  cherryPick,
  commitAll,
  commitBelongsToBranch,
  commitExists,
  createBranch,
  currentBranch,
  detectDefaultSource,
  isValidBranchName,
  latestRelease,
  listBranches,
  pendingCommits,
  releaseBranchExists,
  selectedCommits,
  withTemporaryWorktree,
} from "./git";
import {
  compareVersions,
  isSemVer,
  nextVersion,
  releaseBranch,
} from "./semver";
import {
  CreateReleaseResult,
  PreflightResult,
  ReleaseCommit,
  ReleaseRequest,
  VersionInfo,
} from "./types";
import { updateVersionFiles } from "./versionFiles";

export type RepositoryInfo = {
  readonly currentBranch: string;
  readonly defaultSource: string;
  readonly root: string;
};

export function compareBranches(
  root: string,
  source: string,
  target: string,
): ReleaseCommit[] {
  assertGitRepository(root);
  assertBranch(root, source, "source");
  assertBranch(root, target, "target");

  return pendingCommits(root, source, target);
}

export function createRelease(
  root: string,
  request: ReleaseRequest,
): CreateReleaseResult {
  const preflight = preflightRelease(root, request);

  if (!preflight.ok) {
    return preflight;
  }

  const commits = selectedCommits(
    root,
    request.source,
    request.target,
    request.commits,
  );
  const warnings = [...preflight.warnings];

  return withTemporaryWorktree(root, request.target, (worktree) => {
    cherryPick(worktree, commits);
    warnings.push(...updateVersionFiles(worktree, request.version).warnings);
    commitAll(worktree, `chore(release): v${request.version}`);
    createBranch(worktree, request.releaseBranch);

    return {
      ...preflight,
      appliedCommits: commits.map((commit) => commit.hash),
      nextCommand: `git checkout ${request.releaseBranch}`,
      ok: true,
      warnings,
      worktree,
    };
  });
}

export function preflightRelease(
  root: string,
  request: ReleaseRequest,
): PreflightResult {
  try {
    const validationWarnings = validateReleaseRequest(root, request);
    const commits = selectedCommits(
      root,
      request.source,
      request.target,
      request.commits,
    );
    const version = latestRelease(root, request.target);
    const bump = highestBump(commits);

    withTemporaryWorktree(root, request.target, (worktree) => {
      cherryPick(worktree, commits);
    });

    return {
      bump: bump.bump,
      commits,
      latestRelease: version.latestRelease,
      latestVersion: version.latestVersion,
      nextVersion: request.version,
      ok: true,
      releaseBranch: request.releaseBranch,
      warnings: [...validationWarnings, ...bump.warnings],
    };
  } catch (error) {
    return errorResult(error);
  }
}

export function repositoryInfo(root: string): RepositoryInfo {
  const repositoryRoot = assertGitRepository(root);

  return {
    currentBranch: currentBranch(repositoryRoot),
    defaultSource: detectDefaultSource(repositoryRoot),
    root: repositoryRoot,
  };
}

export function releaseVersion(root: string, target: string): VersionInfo {
  assertGitRepository(root);
  assertBranch(root, target, "target");

  return latestRelease(root, target);
}

export function suggestedRelease(
  root: string,
  source: string,
  target: string,
  commits: string[],
): {
  readonly branch: string;
  readonly bump: string;
  readonly version: string;
  readonly warnings: string[];
} {
  const selected = selectedCommits(root, source, target, commits);
  const latest = latestRelease(root, target);
  const bump = highestBump(selected);
  const version = nextVersion(latest.latestVersion, bump.bump);

  return {
    branch: releaseBranch(version),
    bump: bump.bump,
    version,
    warnings: bump.warnings,
  };
}

export function repositoryBranches(root: string): string[] {
  assertGitRepository(root);

  return listBranches(root);
}

function assertBranch(root: string, branch: string, label: string): void {
  if (!branchExists(root, branch)) {
    throw new Error(`${label} branch does not exist: ${branch}`);
  }
}

function assertCommitSelection(root: string, request: ReleaseRequest): void {
  for (const commit of request.commits) {
    if (!commitExists(root, commit)) {
      throw new Error(`Selected commit does not exist: ${commit}`);
    }

    if (!commitBelongsToBranch(root, commit, request.source)) {
      throw new Error(
        `Selected commit does not belong to source branch: ${commit}`,
      );
    }
  }
}

function errorResult(error: unknown): PreflightResult {
  if (isConflictError(error)) {
    return {
      conflictedFiles: error.conflictedFiles,
      error: "CHERRY_PICK_CONFLICT",
      failedCommit: error.failedCommit,
      ok: false,
      warnings: [],
    };
  }

  return {
    error: error instanceof Error ? error.message : String(error),
    ok: false,
    warnings: [],
  };
}

function isConflictError(error: unknown): error is Error & {
  readonly conflictedFiles: string[];
  readonly failedCommit: string;
} {
  return (
    error instanceof Error &&
    "failedCommit" in error &&
    "conflictedFiles" in error
  );
}

function validateReleaseRequest(
  root: string,
  request: ReleaseRequest,
): string[] {
  assertGitRepository(root);
  assertBranch(root, request.source, "source");
  assertBranch(root, request.target, "target");
  assertCommitSelection(root, request);

  if (!isValidBranchName(root, request.releaseBranch)) {
    throw new Error(`Invalid release branch name: ${request.releaseBranch}`);
  }

  if (releaseBranchExists(root, request.releaseBranch)) {
    throw new Error(`Release branch already exists: ${request.releaseBranch}`);
  }

  if (!isSemVer(request.version)) {
    throw new Error(`Release version is not SemVer: ${request.version}`);
  }

  const version = latestRelease(root, request.target);

  if (compareVersions(request.version, version.latestVersion) <= 0) {
    throw new Error(
      `Release version ${request.version} must be greater than ${version.latestVersion}`,
    );
  }

  if (request.commits.length === 0) {
    throw new Error("At least one commit must be selected.");
  }

  return [];
}
