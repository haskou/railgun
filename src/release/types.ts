export type ChangeType = "major" | "minor" | "patch" | "unknown";

export type CommitStatus = "pending" | "present" | "selected";

export type ReleaseCommit = {
  readonly author: string;
  readonly body: string;
  readonly date: string;
  readonly hash: string;
  readonly reason: string;
  readonly shortHash: string;
  readonly status: CommitStatus;
  readonly subject: string;
  readonly type: ChangeType;
};

export type VersionInfo = {
  readonly latestRelease: string | null;
  readonly latestVersion: string;
  readonly latestVersionSource: "git-tag" | "none";
  readonly target: string;
  readonly warnings: string[];
};

export type ReleaseRequest = {
  readonly commits: string[];
  readonly releaseBranch: string;
  readonly source: string;
  readonly target: string;
  readonly version: string;
};

export type PreflightResult = {
  readonly bump?: ChangeType;
  readonly commits?: ReleaseCommit[];
  readonly conflictedFiles?: string[];
  readonly error?: string;
  readonly failedCommit?: string;
  readonly latestRelease?: string | null;
  readonly latestVersion?: string;
  readonly nextVersion?: string;
  readonly ok: boolean;
  readonly releaseBranch?: string;
  readonly warnings: string[];
};

export type CreateReleaseResult = PreflightResult & {
  readonly appliedCommits?: string[];
  readonly nextCommand?: string;
  readonly worktree?: string;
};
