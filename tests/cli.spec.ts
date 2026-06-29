import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = join(__dirname, "..", "dist", "cli.js");
const dddSkillsRepositoryUrl =
  "https://github.com/haskou/ddd-engineer-skills.git";
const dddSkillsAgents = "# DDD Engineer AGENTS\n";

function railgun(args: string[], cwd?: string): string {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function createSkillsRepository(root: string): string {
  const repository = join(root, "skills-repository");

  mkdirSync(join(repository, "skills", "ddd-engineer"), { recursive: true });
  mkdirSync(join(repository, "skills", "ddd-migration"), { recursive: true });
  mkdirSync(join(repository, "skills", "haskou-value-objects"), {
    recursive: true,
  });
  writeFileSync(
    join(repository, "skills", "ddd-engineer", "SKILL.md"),
    "# DDD engineer\n",
  );
  writeFileSync(
    join(repository, "skills", "ddd-migration", "SKILL.md"),
    "# DDD migration\n",
  );
  writeFileSync(
    join(repository, "skills", "haskou-value-objects", "SKILL.md"),
    "# Haskou value objects\n",
  );
  writeFileSync(join(repository, "AGENTS.md"), dddSkillsAgents);
  execFileSync("git", ["init"], { cwd: repository, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "railgun@example.com"], {
    cwd: repository,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "Railgun Tests"], {
    cwd: repository,
    stdio: "ignore",
  });
  execFileSync("git", ["add", "."], { cwd: repository, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "Add test skills"], {
    cwd: repository,
    stdio: "ignore",
  });

  return repository;
}

function gitRepositoryRedirect(repository: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: `url.file://${repository}.insteadOf`,
    GIT_CONFIG_VALUE_0: dddSkillsRepositoryUrl,
  };
}

describe("railgun cli", () => {
  it("prints help", () => {
    const output = railgun(["help"]);

    expect(output).toContain("railgun init");
    expect(output).toContain("railgun add context <Name>");
    expect(output).toContain("railgun add ci");
    expect(output).toContain("railgun add docker");
    expect(output).toContain("railgun add docker-ci");
    expect(output).toContain("railgun add environment");
    expect(output).toContain("railgun add express");
    expect(output).toContain("railgun add npm");
    expect(output).toContain("railgun add renovate");
    expect(output).toContain("railgun release");
    expect(output).toContain("railgun sync agents");
    expect(output).toContain("railgun sync skills");
  });

  it("keeps README and man page aligned with standalone commands", () => {
    const readme = readFileSync(join(__dirname, "..", "README.md"), "utf8");
    const manPage = readFileSync(
      join(__dirname, "..", "man", "railgun.1"),
      "utf8",
    );

    for (const command of [
      "add ci",
      "add docker",
      "add docker-ci",
      "add environment",
      "release",
      "sync agents",
      "sync skills",
    ]) {
      expect(readme).toContain(`railgun ${command}`);
      expect(manPage).toContain(command);
    }
  });

  it("adds a context with application, domain, infrastructure and tests", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-context-"));

    railgun(["add", "context", "FooBar"], cwd);

    const aggregate = readFileSync(
      join(cwd, "src/contexts/foo-bar/domain/FooBar.ts"),
      "utf8",
    );

    expect(aggregate).toContain("export class FooBar");
    expect(aggregate).toContain("// TODO: Implement");
    expect(aggregate).not.toContain("getId");
    expect(
      readFileSync(
        join(cwd, "src/contexts/foo-bar/domain/value-objects/FooBarId.ts"),
        "utf8",
      ),
    ).toContain("extends UUID");
    expect(
      readFileSync(
        join(
          cwd,
          "src/contexts/foo-bar/domain/repositories/FooBarRepository.ts",
        ),
        "utf8",
      ),
    ).toContain("export default interface FooBarRepository");
    expect(
      readFileSync(
        join(
          cwd,
          "src/contexts/foo-bar/application/find-by-id/messages/FooBarFindByIdMessage.ts",
        ),
        "utf8",
      ),
    ).toContain("public readonly id: FooBarId");
    expect(
      readFileSync(
        join(
          cwd,
          "src/contexts/foo-bar/application/find-by-id/FooBarByIdFinder.ts",
        ),
        "utf8",
      ),
    ).toContain("message.id");
    expect(
      readFileSync(
        join(cwd, "src/contexts/foo-bar/domain/events/FooBarCreatedEvent.ts"),
        "utf8",
      ),
    ).toContain("extends DomainEvent");
    expect(
      readFileSync(
        join(cwd, "src/contexts/foo-bar/application/create/FooBarCreator.ts"),
        "utf8",
      ),
    ).toContain("eventPublisher.publish");
    expect(
      readFileSync(
        join(
          cwd,
          "src/contexts/foo-bar/infrastructure/persistence/DummyFooBarRepository.ts",
        ),
        "utf8",
      ),
    ).toContain("implements FooBarRepository");
    expect(
      readFileSync(join(cwd, "tests/unit/mothers/FooBarMother.ts"), "utf8"),
    ).toContain("public withId(id: FooBarId): this");
    const aggregateSpec = readFileSync(
      join(cwd, "tests/unit/contexts/foo-bar/domain/FooBar.spec.ts"),
      "utf8",
    );

    expect(aggregateSpec).toContain('describe("FooBar"');
    expect(aggregateSpec).toContain("expect(fooBar.is(id)).toBe(true)");
    expect(
      readFileSync(
        join(
          cwd,
          "tests/unit/contexts/foo-bar/domain/services/FooBarDomainService.spec.ts",
        ),
        "utf8",
      ),
    ).toContain("FooBarDomainService");
    expect(
      readFileSync(
        join(
          cwd,
          "tests/unit/contexts/foo-bar/application/FooBarCreator.spec.ts",
        ),
        "utf8",
      ),
    ).toContain("jest-mock-extended");
    expect(
      readFileSync(
        join(
          cwd,
          "tests/unit/contexts/foo-bar/application/FooBarByIdFinder.spec.ts",
        ),
        "utf8",
      ),
    ).toContain("should find a fooBar by id");
    expect(
      readFileSync(
        join(
          cwd,
          "tests/unit/contexts/foo-bar/application/FooBarDeleter.spec.ts",
        ),
        "utf8",
      ),
    ).toContain("should delete a fooBar by id");
  });

  it("copies DDD skills during project initialization without npm dependency", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-init-"));
    const skillsRepository = createSkillsRepository(cwd);

    execFileSync(process.execPath, [cli, "init"], {
      cwd,
      encoding: "utf8",
      env: gitRepositoryRedirect(skillsRepository),
      input: "skills-app\nSkills app\nMIT\nn\nn\nn\nn\n",
    });

    const packageJson = readFileSync(join(cwd, "package.json"), "utf8");

    expect(packageJson).not.toContain("@haskou/ddd-skills");
    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(dddSkillsAgents);
    expect(existsSync(join(cwd, ".agents/skills/ddd-engineer/SKILL.md"))).toBe(
      true,
    );
    expect(
      existsSync(join(cwd, ".agents/skills/haskou-value-objects/SKILL.md")),
    ).toBe(true);
    expect(
      existsSync(join(cwd, ".agents/skills/ddd-engineer-skills.version")),
    ).toBe(true);
    expect(
      existsSync(
        join(cwd, "src/shared/infrastructure/environment/ApplicationKernel.ts"),
      ),
    ).toBe(true);
    expect(existsSync(join(cwd, "src/apps/environment"))).toBe(false);
  });

  it("initializes optional integrations by default", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-init-defaults-"));
    const skillsRepository = createSkillsRepository(cwd);

    execFileSync(process.execPath, [cli, "init"], {
      cwd,
      encoding: "utf8",
      env: gitRepositoryRedirect(skillsRepository),
      input: "\n\n\n\n\n\n\n",
    });

    const readme = readFileSync(join(cwd, "README.md"), "utf8");

    expect(existsSync(join(cwd, "Dockerfile"))).toBe(true);
    expect(existsSync(join(cwd, ".github/workflows/ci.yml"))).toBe(true);
    expect(existsSync(join(cwd, "renovate.json"))).toBe(true);
    expect(
      existsSync(
        join(cwd, "src/shared/infrastructure/ui/routes/HealthRoute.ts"),
      ),
    ).toBe(true);
    expect(readme).toContain("railgun add context Foo");
    expect(readme).toContain("## License");
    expect(readme).toContain("MIT. See [LICENSE](LICENSE).");
    expect(readme).toContain("img.shields.io/npm/v/railgun-init-defaults-");
    expect(readme).toContain("## Release Branches");
    expect(readFileSync(join(cwd, "package.json"), "utf8")).toContain(
      '"pack:dry": "npm pack --dry-run"',
    );
  });

  it("adds expressive API test client and definitions with Express", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-express-"));
    const skillsRepository = createSkillsRepository(cwd);

    execFileSync(process.execPath, [cli, "init"], {
      cwd,
      encoding: "utf8",
      env: gitRepositoryRedirect(skillsRepository),
      input: "express-app\nExpress app\nMIT\ny\nn\nn\nn\n",
    });

    const restClient = readFileSync(
      join(cwd, "tests/api/steps/RestClient.ts"),
      "utf8",
    );
    const definitions = readFileSync(
      join(cwd, "tests/api/steps/Definitions.ts"),
      "utf8",
    );

    expect(restClient).toContain("public post(");
    expect(restClient).toContain("public put(");
    expect(restClient).toContain("public patch(");
    expect(restClient).toContain("public delete(");
    expect(restClient).toContain("API_BASE_URL");
    expect(definitions).toContain("I POST {string} with body:");
    expect(definitions).toContain("response body is equal to:");
    expect(definitions).toContain("response body contains {string}");
  });

  it("adds environment config standalone", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-environment-"));

    railgun(["add", "environment"], cwd);

    expect(
      existsSync(
        join(cwd, "src/shared/infrastructure/environment/ApplicationKernel.ts"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          cwd,
          "src/shared/infrastructure/environment/dependencyInjectionOptions.ts",
        ),
      ),
    ).toBe(true);
    expect(existsSync(join(cwd, ".env.local"))).toBe(true);
    expect(readFileSync(join(cwd, ".env.test"), "utf8")).toContain(
      "HTTP_PORT=8081",
    );
  });

  it("adds Docker config standalone", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-docker-"));

    railgun(["add", "docker"], cwd);

    expect(readFileSync(join(cwd, "Dockerfile"), "utf8")).toContain(
      "FROM node:",
    );
    expect(readFileSync(join(cwd, "docker-compose.yml"), "utf8")).toContain(
      "services:",
    );
  });

  it("adds Docker CI workflow and README badge standalone", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-docker-ci-"));

    writeFileSync(join(cwd, "README.md"), "# docker-ci-app\n");

    railgun(["add", "docker-ci"], cwd);

    const workflow = readFileSync(
      join(cwd, ".github/workflows/docker.yml"),
      "utf8",
    );
    const readme = readFileSync(join(cwd, "README.md"), "utf8");

    expect(workflow).toContain("name: Docker");
    expect(workflow).toContain("docker build --target tests");
    expect(workflow).toContain("docker build --target runtime");
    expect(readme).toContain(
      "github.com/haskou/railgun/actions/workflows/docker.yml",
    );
    expect(readme).toContain("[![Docker]");
  });

  it("syncs AGENTS.md standalone", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-agents-"));
    const skillsRepository = createSkillsRepository(cwd);

    writeFileSync(join(cwd, "AGENTS.md"), "stale\n");
    execFileSync(process.execPath, [cli, "sync", "agents"], {
      cwd,
      encoding: "utf8",
      env: gitRepositoryRedirect(skillsRepository),
    });

    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(dddSkillsAgents);
  });

  it("syncs DDD skills standalone", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-skills-"));
    const skillsRepository = createSkillsRepository(cwd);

    execFileSync(process.execPath, [cli, "sync", "skills"], {
      cwd,
      encoding: "utf8",
      env: gitRepositoryRedirect(skillsRepository),
    });

    expect(existsSync(join(cwd, ".agents/skills/ddd-engineer/SKILL.md"))).toBe(
      true,
    );
    expect(existsSync(join(cwd, ".agents/skills/ddd-migration/SKILL.md"))).toBe(
      true,
    );
    expect(
      existsSync(join(cwd, ".agents/skills/haskou-value-objects/SKILL.md")),
    ).toBe(true);
  });

  it("adds npm badge using project name fallback when no git repository exists", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-npm-"));

    writeFileSync(join(cwd, "README.md"), "# fallback-app\n");

    railgun(["add", "npm"], cwd);

    const workflow = readFileSync(
      join(cwd, ".github/workflows/ci.yml"),
      "utf8",
    );

    expect(readFileSync(join(cwd, "README.md"), "utf8")).toContain(
      "github.com/haskou/railgun/actions/workflows/ci.yml",
    );
    expect(readFileSync(join(cwd, "README.md"), "utf8")).toContain(
      "img.shields.io/npm/v/railgun.svg",
    );
    expect(readFileSync(join(cwd, "README.md"), "utf8")).toContain(
      "## Release Branches",
    );
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npm publish --access public --tag latest");
    expect(workflow).toContain("npm run pack:dry");
    expect(workflow).toContain(
      "startsWith(github.event.pull_request.title, 'fix(')",
    );
    expect(workflow).toContain(
      "PR_TITLE: ${{ github.event.pull_request.title }}",
    );
    expect(workflow).toContain("fix:*|fix\\(*");
    expect(workflow).not.toContain("NPM_TOKEN");
    expect(workflow).not.toContain("NODE_AUTH_TOKEN");
  });

  it("adds CI workflow as a standalone alias", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-ci-"));

    writeFileSync(join(cwd, "README.md"), "# ci-app\n");

    railgun(["add", "ci"], cwd);

    expect(
      readFileSync(join(cwd, ".github/workflows/ci.yml"), "utf8"),
    ).toContain("Publish to npm");
    expect(readFileSync(join(cwd, "README.md"), "utf8")).toContain(
      "## Release Branches",
    );
  });

  it("adds npm badge using the GitHub remote when available", () => {
    const cwd = mkdtempSync(join(tmpdir(), "railgun-npm-git-"));

    writeFileSync(join(cwd, "README.md"), "# remote-app\n");
    execFileSync("git", ["init"], { cwd, stdio: "ignore" });
    execFileSync(
      "git",
      ["remote", "add", "origin", "git@github.com:acme/remote-app.git"],
      { cwd, stdio: "ignore" },
    );

    railgun(["add", "npm"], cwd);

    expect(readFileSync(join(cwd, "README.md"), "utf8")).toContain(
      "github.com/acme/remote-app/actions/workflows/ci.yml",
    );
  });
});
