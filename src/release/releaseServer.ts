import { spawn } from "node:child_process";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { AddressInfo } from "node:net";
import { URL } from "node:url";

import {
  compareBranches,
  createRelease,
  preflightRelease,
  releaseVersion,
  repositoryBranches,
  repositoryInfo,
  suggestedRelease,
} from "./releaseService";
import { ReleaseRequest } from "./types";
import { releaseUi } from "./ui";

export type ReleaseServerOptions = {
  readonly open: boolean;
  readonly path?: string;
  readonly port?: number;
  readonly root: string;
};

export async function startReleaseServer(
  options: ReleaseServerOptions,
): Promise<string> {
  const server = createServer((request, response) => {
    handleRequest(options.root, request, response).catch((error: unknown) => {
      json(response, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(options.port ?? 0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${address.port}${options.path ?? ""}`;

  console.log(`Railgun release UI: ${url}`);

  if (options.open) {
    openBrowser(url);
  }

  return url;
}

async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  return raw ? JSON.parse(raw) : {};
}

async function handleApi(
  root: string,
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<void> {
  const handler = apiHandler(request.method, url.pathname);

  if (handler) {
    await handler(root, request, response, url);

    return;
  }

  json(response, 404, { error: "Not found" });
}

function apiHandler(method: string | undefined, path: string) {
  if (method === "GET") {
    return getApiHandler(path);
  }

  if (method === "POST") {
    return postApiHandler(path);
  }

  return undefined;
}

function getApiHandler(path: string) {
  if (path === "/api/repo") {
    return handleRepositoryInfo;
  }

  if (path === "/api/branches") {
    return handleBranches;
  }

  if (path === "/api/compare") {
    return handleCompare;
  }

  if (path === "/api/version") {
    return handleVersion;
  }

  return undefined;
}

function postApiHandler(path: string) {
  if (path === "/api/suggest") {
    return handleSuggest;
  }

  if (path === "/api/preflight") {
    return handlePreflight;
  }

  if (path === "/api/create-release") {
    return handleCreateRelease;
  }

  return undefined;
}

function handleBranches(
  root: string,
  _request: IncomingMessage,
  response: ServerResponse,
): void {
  json(response, 200, { branches: repositoryBranches(root) });
}

function handleCompare(
  root: string,
  _request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): void {
  const source = requiredParam(url, "source");
  const target = requiredParam(url, "target");

  json(response, 200, { commits: compareBranches(root, source, target) });
}

async function handleCreateRelease(
  root: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  json(
    response,
    200,
    createRelease(root, (await body(request)) as ReleaseRequest),
  );
}

async function handlePreflight(
  root: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  json(
    response,
    200,
    preflightRelease(root, (await body(request)) as ReleaseRequest),
  );
}

function handleRepositoryInfo(
  root: string,
  _request: IncomingMessage,
  response: ServerResponse,
): void {
  json(response, 200, repositoryInfo(root));
}

async function handleSuggest(
  root: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const payload = (await body(request)) as {
    readonly commits: string[];
    readonly source: string;
    readonly target: string;
  };

  json(
    response,
    200,
    suggestedRelease(root, payload.source, payload.target, payload.commits),
  );
}

function handleVersion(
  root: string,
  _request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): void {
  json(response, 200, releaseVersion(root, requiredParam(url, "target")));
}

async function handleRequest(
  root: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");

  if (url.pathname.startsWith("/api/")) {
    await handleApi(root, request, response, url);

    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(releaseUi());
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

function openBrowser(url: string): void {
  const command = process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [url], { detached: true, stdio: "ignore" });

  child.unref();
}

function requiredParam(url: URL, name: string): string {
  const value = url.searchParams.get(name);

  if (!value) {
    throw new Error(`Missing query parameter: ${name}`);
  }

  return value;
}
