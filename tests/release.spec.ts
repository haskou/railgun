import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { highestBump, inferChangeType } from "../src/release/changeInference";
import { startReleaseServer } from "../src/release/releaseServer";
import {
  compareBranches,
  createRelease,
  preflightRelease,
  releaseVersion,
  repositoryBranches,
  repositoryInfo,
  suggestedRelease,
} from "../src/release/releaseService";
import { nextVersion, releaseBranch } from "../src/release/semver";

function commit(
  root: string,
  file: string,
  content: string,
  message: string,
): string {
  writeFileSync(join(root, file), content);
  git(root, ["add", file]);
  git(root, ["commit", "-m", message]);

  return git(root, ["rev-parse", "HEAD"]).trim();
}

function commitWithAuthorDate(
  root: string,
  file: string,
  content: string,
  message: string,
  authorDate: string,
): string {
  writeFileSync(join(root, file), content);
  git(root, ["add", file]);
  execFileSync("git", ["commit", "-m", message], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: authorDate,
    },
  });

  return git(root, ["rev-parse", "HEAD"]).trim();
}

function git(root: string, args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function gitSucceeds(root: string, args: string[]): boolean {
  try {
    git(root, args);

    return true;
  } catch {
    return false;
  }
}

function repo(defaultBranch = "main"): string {
  const root = mkdtempSync(join(tmpdir(), "railgun-release-test-"));

  git(root, ["init", "-b", defaultBranch]);
  git(root, ["config", "user.email", "railgun@example.com"]);
  git(root, ["config", "user.name", "Railgun Tests"]);
  commit(root, "README.md", "# test\n", "chore: initial");

  return root;
}

describe("release git workflow", () => {
  it("detects main as default source", () => {
    const root = repo("main");

    expect(repositoryInfo(root).defaultSource).toBe("main");
  });

  it("detects master when main does not exist", () => {
    const root = repo("master");

    expect(repositoryInfo(root).defaultSource).toBe("master");
  });

  it("lists branches", () => {
    const root = repo();

    git(root, ["checkout", "-b", "production"]);

    expect(repositoryBranches(root)).toEqual(
      expect.arrayContaining(["main", "production"]),
    );
  });

  it("detects pending commits and ignores patch-equivalent commits", () => {
    const root = repo();

    git(root, ["checkout", "-b", "production"]);
    git(root, ["checkout", "main"]);
    const pending = commit(
      root,
      "feature.txt",
      "feature\n",
      "feat: add feature",
    );
    const equivalent = commit(root, "fix.txt", "fix\n", "fix: add fix");
    git(root, ["checkout", "production"]);
    git(root, ["cherry-pick", equivalent]);

    const commits = compareBranches(root, "main", "production");

    expect(commits.find((commit) => commit.hash === pending)?.status).toBe(
      "pending",
    );
    expect(commits.find((commit) => commit.hash === equivalent)?.status).toBe(
      "present",
    );
  });

  it("reads latest SemVer release from tags reachable from target", () => {
    const root = repo();

    git(root, ["tag", "v1.3.0"]);
    git(root, ["tag", "not-semver"]);
    git(root, ["tag", "1.4.2"]);

    expect(releaseVersion(root, "main")).toMatchObject({
      latestRelease: "1.4.2",
      latestVersion: "1.4.2",
    });
  });

  it("uses 0.0.0 when there are no reachable SemVer releases", () => {
    const root = repo();

    git(root, ["tag", "release-one"]);

    expect(releaseVersion(root, "main")).toMatchObject({
      latestRelease: null,
      latestVersion: "0.0.0",
    });
  });

  it("calculates version bumps and release branch names", () => {
    expect(nextVersion("1.4.2", "patch")).toBe("1.4.3");
    expect(nextVersion("1.4.2", "minor")).toBe("1.5.0");
    expect(nextVersion("1.4.2", "major")).toBe("2.0.0");
    expect(releaseBranch("1.5.0")).toBe("release/v1.5.0");
  });

  it("infers change type from branches and conventional commits", () => {
    expect(inferChangeType(["origin/fix/token"], "whatever", "").type).toBe(
      "patch",
    );
    expect(inferChangeType(["feat/login"], "whatever", "").type).toBe("minor");
    expect(inferChangeType(["break/config"], "whatever", "").type).toBe(
      "major",
    );
    expect(inferChangeType([], "feat: add release command", "").type).toBe(
      "minor",
    );
    expect(inferChangeType([], "fix: repair branch detection", "").type).toBe(
      "patch",
    );
    expect(inferChangeType([], "feat!: change API", "").type).toBe("major");
    expect(inferChangeType([], "docs: update", "").type).toBe("unknown");
  });

  it("uses the highest selected bump and patch for all unknown commits", () => {
    expect(highestBump([{ type: "patch" }]).bump).toBe("patch");
    expect(highestBump([{ type: "patch" }, { type: "minor" }]).bump).toBe(
      "minor",
    );
    expect(highestBump([{ type: "major" }, { type: "minor" }]).bump).toBe(
      "major",
    );
    expect(highestBump([{ type: "unknown" }]).bump).toBe("patch");
    expect(highestBump([{ type: "unknown" }]).warnings).toHaveLength(1);
  });

  it("fails invalid release requests", () => {
    const root = repo();

    git(root, ["checkout", "-b", "production"]);
    git(root, ["checkout", "main"]);
    const hash = commit(root, "fix.txt", "fix\n", "fix: issue");
    git(root, ["tag", "v1.0.0", "production"]);
    git(root, ["branch", "release/v1.0.1", "production"]);

    expect(
      preflightRelease(root, {
        commits: [hash],
        releaseBranch: "release/v1.0.1",
        source: "main",
        target: "production",
        version: "1.0.1",
      }).ok,
    ).toBe(false);
    expect(
      preflightRelease(root, {
        commits: [hash],
        releaseBranch: "release/v1.0.2",
        source: "main",
        target: "production",
        version: "not-semver",
      }).ok,
    ).toBe(false);
    expect(
      preflightRelease(root, {
        commits: [hash],
        releaseBranch: "release/v1.0.0",
        source: "main",
        target: "production",
        version: "1.0.0",
      }).ok,
    ).toBe(false);
    expect(
      preflightRelease(root, {
        commits: ["missing"],
        releaseBranch: "release/v1.0.2",
        source: "main",
        target: "production",
        version: "1.0.2",
      }).ok,
    ).toBe(false);
  });

  it("fails when the release branch already exists remotely", () => {
    const root = repo();
    const remote = mkdtempSync(join(tmpdir(), "railgun-release-remote-"));

    git(remote, ["init", "--bare"]);
    git(root, ["checkout", "-b", "production"]);
    git(root, ["checkout", "main"]);
    const hash = commit(root, "fix.txt", "fix\n", "fix: remote branch");
    git(root, ["remote", "add", "origin", remote]);
    git(root, ["push", "origin", "main:release/v0.0.1"]);
    git(root, ["fetch", "origin"]);

    expect(
      preflightRelease(root, {
        commits: [hash],
        releaseBranch: "release/v0.0.1",
        source: "main",
        target: "production",
        version: "0.0.1",
      }).ok,
    ).toBe(false);
  });

  it("creates release branch from target and updates npm version files", () => {
    const root = repo();

    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ name: "test", version: "1.0.0" }, null, 2),
    );
    writeFileSync(
      join(root, "package-lock.json"),
      JSON.stringify(
        {
          name: "test",
          packages: { "": { name: "test", version: "1.0.0" } },
          version: "1.0.0",
        },
        null,
        2,
      ),
    );
    git(root, ["add", "package.json", "package-lock.json"]);
    git(root, ["commit", "-m", "chore: add package files"]);
    git(root, ["tag", "v1.0.0"]);
    git(root, ["checkout", "-b", "production"]);
    git(root, ["checkout", "main"]);
    const first = commit(root, "a.txt", "a\n", "fix: first");
    const second = commit(root, "b.txt", "b\n", "fix: second");

    const suggestion = suggestedRelease(root, "main", "production", [
      first,
      second,
    ]);
    const result = createRelease(root, {
      commits: [first, second],
      releaseBranch: suggestion.branch,
      source: "main",
      target: "production",
      version: suggestion.version,
    });

    expect(result.ok).toBe(true);
    expect(
      git(root, ["rev-parse", "--verify", suggestion.branch]).trim(),
    ).toBeTruthy();
    expect(
      git(root, ["log", "-1", "--format=%s", suggestion.branch]).trim(),
    ).toBe(`chore(release): v${suggestion.version}`);
    expect(
      JSON.parse(git(root, ["show", `${suggestion.branch}:package.json`]))
        .version,
    ).toBe("1.0.1");
    expect(git(root, ["log", "--format=%s", suggestion.branch])).toContain(
      "fix: first",
    );
    expect(git(root, ["log", "--format=%s", suggestion.branch])).toContain(
      "fix: second",
    );
  });

  it("keeps selected commits in source history order when author dates differ", () => {
    const root = repo();

    git(root, ["checkout", "-b", "production"]);
    git(root, ["checkout", "main"]);
    const parent = commitWithAuthorDate(
      root,
      "ordered.txt",
      "base\nparent\n",
      "fix: parent patch",
      "2030-01-01T00:00:00Z",
    );
    const child = commitWithAuthorDate(
      root,
      "ordered.txt",
      "base\nparent\nchild\n",
      "fix: child patch",
      "2020-01-01T00:00:00Z",
    );

    const result = preflightRelease(root, {
      commits: [parent, child],
      releaseBranch: "release/v0.0.1",
      source: "main",
      target: "production",
      version: "0.0.1",
    });

    expect(result.ok).toBe(true);
  });

  it("does not leave a partial release branch when preparation fails", () => {
    const root = repo();

    writeFileSync(join(root, "package.json"), "{invalid-json");
    git(root, ["add", "package.json"]);
    git(root, ["commit", "-m", "chore: add invalid package"]);
    git(root, ["checkout", "-b", "production"]);
    git(root, ["checkout", "main"]);
    const hash = commit(root, "fix.txt", "fix\n", "fix: release input");

    expect(() =>
      createRelease(root, {
        commits: [hash],
        releaseBranch: "release/v0.0.1",
        source: "main",
        target: "production",
        version: "0.0.1",
      }),
    ).toThrow();
    expect(gitSucceeds(root, ["rev-parse", "--verify", "release/v0.0.1"])).toBe(
      false,
    );
  });

  it("detects cherry-pick conflicts without modifying the main working tree", () => {
    const root = repo();

    commit(root, "conflict.txt", "base\n", "chore: base conflict");
    git(root, ["checkout", "-b", "production"]);
    commit(root, "conflict.txt", "production\n", "fix: production change");
    git(root, ["checkout", "main"]);
    const hash = commit(root, "conflict.txt", "main\n", "fix: main change");
    const before = git(root, ["status", "--short"]);

    const result = preflightRelease(root, {
      commits: [hash],
      releaseBranch: "release/v0.0.1",
      source: "main",
      target: "production",
      version: "0.0.1",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("CHERRY_PICK_CONFLICT");
    expect(result.conflictedFiles).toContain("conflict.txt");
    expect(git(root, ["status", "--short"])).toBe(before);
  });

  it("rejects release server startup when the requested port is busy", async () => {
    const server = createServer();

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    await expect(
      startReleaseServer({ open: false, port, root: process.cwd() }),
    ).rejects.toThrow();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
});
