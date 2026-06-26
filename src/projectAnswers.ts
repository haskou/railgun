import { readFileSync } from "node:fs";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import { basename } from "./naming";

export type ProjectAnswers = {
  readonly description: string;
  readonly docker: boolean;
  readonly express: boolean;
  readonly license: string;
  readonly name: string;
  readonly npm: boolean;
  readonly renovate: boolean;
};

export async function askProjectAnswers(root: string): Promise<ProjectAnswers> {
  if (!process.stdin.isTTY) {
    return answersFromPipe(root);
  }

  const rl = createInterface({ input, output });

  try {
    const name = await question(rl, "name", basename(root));
    const description = await question(rl, "description", "");
    const license = await question(rl, "license", "MIT");
    const express = await confirm(rl, "express", true);
    const docker = await confirm(rl, "docker", true);
    const npm = await confirm(rl, "npm ci", true);
    const renovate = await confirm(rl, "renovate", true);

    return {
      description,
      docker,
      express,
      license,
      name,
      npm,
      renovate,
    };
  } finally {
    rl.close();
  }
}

function answersFromPipe(root: string): ProjectAnswers {
  const lines = readFileSync(0, "utf8").split(/\r?\n/);
  let index = 0;
  const next = (defaultValue: string): string => {
    const value = lines[index]?.trim();
    index += 1;

    return value || defaultValue;
  };
  const nextBoolean = (defaultValue: boolean): boolean => {
    const value = lines[index]?.trim().toLowerCase();
    index += 1;

    if (!value) {
      return defaultValue;
    }

    return ["y", "yes", "s", "si", "sí"].includes(value);
  };
  const name = next(basename(root));
  const description = next("");
  const license = next("MIT");
  const express = nextBoolean(true);
  const docker = nextBoolean(true);
  const npm = nextBoolean(true);
  const renovate = nextBoolean(true);

  return {
    description,
    docker,
    express,
    license,
    name,
    npm,
    renovate,
  };
}

async function question(
  rl: ReturnType<typeof createInterface>,
  label: string,
  defaultValue: string,
): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await rl.question(`${label}${suffix}: `);

  return answer.trim() || defaultValue;
}

async function confirm(
  rl: ReturnType<typeof createInterface>,
  label: string,
  defaultValue: boolean,
): Promise<boolean> {
  const suffix = defaultValue ? " [Y/n]" : " [y/N]";
  const answer = (await rl.question(`${label}${suffix}: `))
    .trim()
    .toLowerCase();

  if (!answer) {
    return defaultValue;
  }

  return ["y", "yes", "s", "si", "sí"].includes(answer);
}
