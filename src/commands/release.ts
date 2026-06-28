import { startReleaseServer } from "../release/releaseServer";
import { repositoryInfo } from "../release/releaseService";

export type ReleaseCommandOptions = {
  readonly branch?: string;
  readonly noOpen: boolean;
  readonly port?: number;
  readonly source?: string;
  readonly target?: string;
  readonly version?: string;
};

export async function release(root: string, args: string[]): Promise<void> {
  const options = parseReleaseOptions(args);
  const info = repositoryInfo(root);
  const query = new URLSearchParams();

  if (options.source ?? info.defaultSource) {
    query.set("source", options.source ?? info.defaultSource);
  }

  if (options.target) {
    query.set("target", options.target);
  }

  if (options.version) {
    query.set("version", options.version);
  }

  if (options.branch) {
    query.set("branch", options.branch);
  }

  await startReleaseServer({
    open: !options.noOpen,
    path: query.size > 0 ? `?${query.toString()}` : undefined,
    port: options.port,
    root,
  });
}

function parseReleaseOptions(args: string[]): ReleaseCommandOptions {
  const options: {
    branch?: string;
    noOpen?: boolean;
    port?: number;
    source?: string;
    target?: string;
    version?: string;
  } = {};

  for (let index = 0; index < args.length; index += 1) {
    index += parseReleaseOption(options, args, index);
  }

  return {
    noOpen: options.noOpen ?? false,
    ...options,
  };
}

function parseReleaseOption(
  options: {
    branch?: string;
    noOpen?: boolean;
    port?: number;
    source?: string;
    target?: string;
    version?: string;
  },
  args: string[],
  index: number,
): number {
  const arg = args[index];

  if (arg === "--no-open") {
    options.noOpen = true;

    return 0;
  }

  if (!isValuedReleaseOption(arg)) {
    throw new Error(`Unknown release option: ${arg}`);
  }

  const value = next(args, index);

  assignReleaseOption(options, arg, value);

  return 1;
}

function assignReleaseOption(
  options: {
    branch?: string;
    port?: number;
    source?: string;
    target?: string;
    version?: string;
  },
  arg: string,
  value: string,
): void {
  if (arg === "--source") {
    options.source = value;
  } else if (arg === "--target") {
    options.target = value;
  } else if (arg === "--branch") {
    options.branch = value;
  } else if (arg === "--version") {
    options.version = value;
  } else if (arg === "--port") {
    options.port = Number(value);
  }
}

function isValuedReleaseOption(arg: string): boolean {
  return ["--source", "--target", "--branch", "--version", "--port"].includes(
    arg,
  );
}

function next(args: string[], index: number): string {
  const value = args[index + 1];

  if (!value) {
    throw new Error(`Missing value for ${args[index]}`);
  }

  return value;
}
