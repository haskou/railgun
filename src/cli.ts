#!/usr/bin/env node
/* eslint-disable complexity */
import { addContext } from "./commands/addContext";
import { addDocker } from "./commands/addDocker";
import { addDockerCi } from "./commands/addDockerCi";
import { addEnvironment } from "./commands/addEnvironment";
import { addExpress } from "./commands/addExpress";
import { addNpm } from "./commands/addNpm";
import { addRenovate } from "./commands/addRenovate";
import { initProject } from "./commands/initProject";
import { syncAgents } from "./commands/syncAgents";
import { syncSkills } from "./commands/syncSkills";
import { help } from "./help";

type CommandHandler = (argument?: string) => Promise<void> | void;

async function main(argv = process.argv.slice(2)): Promise<void> {
  const [command, subcommand, argument] = argv;

  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    console.log(help);

    return;
  }

  const handler =
    commandHandlers()[[command, subcommand].filter(Boolean).join(" ")];

  if (!handler) {
    throw new Error(`Unknown command: ${argv.join(" ")}`);
  }

  await handler(argument);
}

function commandHandlers(): Record<string, CommandHandler> {
  return {
    "add ci": () => addNpm(process.cwd()),
    "add context": (name) => {
      assertName(
        name,
        "Missing context name. Example: railgun add context Foo",
      );
      addContext(process.cwd(), name);
    },
    "add docker": () => addDocker(process.cwd()),
    "add docker-ci": () => addDockerCi(process.cwd()),
    "add environment": () => addEnvironment(process.cwd()),
    "add express": () => addExpress(process.cwd()),
    "add npm": () => addNpm(process.cwd()),
    "add renovate": () => addRenovate(process.cwd()),
    init: () => initProject(process.cwd()),
    "sync agents": () => syncAgents(process.cwd()),
    "sync skills": () => syncSkills(process.cwd()),
  };
}

function assertName(
  value: string | undefined,
  message: string,
): asserts value is string {
  if (!value) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
