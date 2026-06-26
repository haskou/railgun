#!/usr/bin/env node
/* eslint-disable complexity */
import { addContext } from "./commands/addContext";
import { addExpress } from "./commands/addExpress";
import { addNpm } from "./commands/addNpm";
import { addRenovate } from "./commands/addRenovate";
import { initProject } from "./commands/initProject";
import { help } from "./help";

async function main(argv = process.argv.slice(2)): Promise<void> {
  const [command, subcommand, name] = argv;

  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    console.log(help);

    return;
  }

  if (command === "init") {
    await initProject(process.cwd());

    return;
  }

  if (command === "add" && subcommand === "context") {
    assertName(name, "Missing context name. Example: railgun add context Foo");
    addContext(process.cwd(), name);

    return;
  }

  if (command === "add" && subcommand === "express") {
    addExpress(process.cwd());

    return;
  }

  if (command === "add" && subcommand === "npm") {
    addNpm(process.cwd());

    return;
  }

  if (command === "add" && subcommand === "renovate") {
    addRenovate(process.cwd());

    return;
  }

  throw new Error(`Unknown command: ${argv.join(" ")}`);
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
