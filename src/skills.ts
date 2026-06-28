import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const developmentSkillsPath = "/home/hasko/Projects/ddd-engineer-skill/skills";

export function copyDddSkills(root: string): void {
  const source = resolveSkillsPath();

  if (!source) {
    console.log("DDD skills not found. Skipping skill copy.");

    return;
  }

  const target = join(root, ".agents", "skills");
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
  writeVersionFile(source, target);
  console.log(`Copied DDD skills from ${source}`);
}

function resolveSkillsPath(): string | undefined {
  const candidates = [
    process.env.RAILGUN_DDD_SKILLS_PATH,
    join(__dirname, "..", "skills"),
    join(__dirname, "..", "..", "skills"),
    developmentSkillsPath,
  ];

  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && existsSync(candidate),
  );
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
