import { execFileSync } from "node:child_process";

export type GithubRepository = {
  readonly owner: string;
  readonly repository: string;
};

export function resolveGithubRepository(
  root: string,
  fallbackRepository: string,
): GithubRepository {
  return (
    resolveFromGh(root) ??
    resolveFromGitRemote(root) ?? {
      owner: "haskou",
      repository: fallbackRepository,
    }
  );
}

function resolveFromGh(root: string): GithubRepository | undefined {
  try {
    const output = execFileSync(
      "gh",
      ["repo", "view", "--json", "owner,name"],
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    const parsed: unknown = JSON.parse(output);

    if (!isGhRepository(parsed)) {
      return undefined;
    }

    return {
      owner: parsed.owner.login,
      repository: parsed.name,
    };
  } catch {
    return undefined;
  }
}

function resolveFromGitRemote(root: string): GithubRepository | undefined {
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return parseGithubRemote(remote);
  } catch {
    return undefined;
  }
}

function parseGithubRemote(remote: string): GithubRepository | undefined {
  const match = remote.match(/github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);

  if (!match) {
    return undefined;
  }

  return {
    owner: match[1],
    repository: match[2],
  };
}

function isGhRepository(value: unknown): value is {
  readonly name: string;
  readonly owner: { readonly login: string };
} {
  if (!isRecord(value) || !isRecord(value.owner)) {
    return false;
  }

  return (
    typeof value.name === "string" && typeof value.owner.login === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
