import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const defaultSkillsRepository =
  "https://github.com/haskou/ddd-engineer-skills.git";

export function copyDddAgents(root: string): void {
  withDddSkillsRepository((checkout) => {
    cpSync(join(checkout, "AGENTS.md"), join(root, "AGENTS.md"));
    console.log(`Copied AGENTS.md from ${defaultSkillsRepository}`);
  });
}

export function copyDddSkills(root: string): void {
  withDddSkillsRepository((checkout) => {
    const source = join(checkout, "skills");
    const target = join(root, ".agents", "skills");

    mkdirSync(target, { recursive: true });
    cpSync(source, target, { recursive: true });
    writeVersionFile(checkout, target);
    console.log(`Copied DDD skills from ${defaultSkillsRepository}`);
  });
}

function withDddSkillsRepository(callback: (checkout: string) => void): void {
  const checkout = mkdtempSync(join(tmpdir(), "railgun-ddd-skills-"));

  try {
    execFileSync(
      "git",
      ["clone", "--depth", "1", defaultSkillsRepository, checkout],
      {
        stdio: "ignore",
      },
    );
    callback(checkout);
  } finally {
    rmSync(checkout, { force: true, recursive: true });
  }
}

function writeVersionFile(source: string, target: string): void {
  const version = resolveVersion(source);

  if (!version) {
    return;
  }

  writeFileSync(join(target, "ddd-engineer-skills.version"), `${version}\n`);
}

function resolveVersion(source: string): string | undefined {
  try {
    return execFileSync("git", ["-C", source, "log", "-1", "--pretty=%h %s"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return basename(source);
  }
}
