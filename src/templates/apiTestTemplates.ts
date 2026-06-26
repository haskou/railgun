export function cucumberConfig(): string {
  return `const api = [
  "tests/api/features/**/*.feature",
  "--require tests/api/steps/*.ts",
  "--require-module ts-node/register",
  "--require-module tsconfig-paths/register tsconfig",
  "--exit",
].join(" ");

module.exports = {
  api,
};
`;
}

export function healthFeature(): string {
  return `Feature: Health

  Scenario: Check service health
    When I GET "/health"
    Then response code is equal to 200
`;
}

export function restClient(): string {
  return `import axios, { Axios, AxiosRequestConfig, AxiosResponse, Method } from "axios";

export type RestClientResponse = {
  readonly data: unknown;
  readonly headers: unknown;
  readonly status: number;
};

export default class RestClient {
  private readonly client: Axios;

  private static baseUrl(): string {
    const port = process.env.HTTP_PORT || 8081;

    return process.env.API_BASE_URL ?? \`http://localhost:\${port}\`;
  }

  private static toResponse(response: AxiosResponse<unknown>): RestClientResponse {
    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
    };
  }

  constructor(baseURL: string = RestClient.baseUrl()) {
    this.client = axios.create({ baseURL });
  }

  private async request(
    method: Method,
    path: string,
    data: unknown,
    config: AxiosRequestConfig,
  ): Promise<RestClientResponse> {
    try {
      return RestClient.toResponse(
        await this.client.request({
          ...config,
          data,
          method,
          url: path,
        }),
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return RestClient.toResponse(error.response);
      }

      throw error;
    }
  }

  public delete(path: string, config: AxiosRequestConfig = {}): Promise<RestClientResponse> {
    return this.request("DELETE", path, undefined, config);
  }

  public get(path: string, config: AxiosRequestConfig = {}): Promise<RestClientResponse> {
    return this.request("GET", path, undefined, config);
  }

  public patch(
    path: string,
    body: unknown = undefined,
    config: AxiosRequestConfig = {},
  ): Promise<RestClientResponse> {
    return this.request("PATCH", path, body, config);
  }

  public post(
    path: string,
    body: unknown = undefined,
    config: AxiosRequestConfig = {},
  ): Promise<RestClientResponse> {
    return this.request("POST", path, body, config);
  }

  public put(
    path: string,
    body: unknown = undefined,
    config: AxiosRequestConfig = {},
  ): Promise<RestClientResponse> {
    return this.request("PUT", path, body, config);
  }
}
`;
}

export function apiDefinitions(): string {
  return `import { init } from "@app/index";
import { ApplicationKernel } from "@app/shared/infrastructure/environment/ApplicationKernel";
import { setDefaultTimeout } from "@cucumber/cucumber";
import { expect } from "chai";
import { after, before, binding, then, when } from "cucumber-tsflow";

import RestClient, { RestClientResponse } from "./RestClient";

setDefaultTimeout(20_000);

let kernel: ApplicationKernel | undefined;

@binding()
export default class Definitions {
  private response: RestClientResponse | undefined = undefined;

  private readonly restClient: RestClient = new RestClient();

  private static parseBody(body: string): unknown {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  @before()
  public async startKernel(): Promise<void> {
    if (!kernel) {
      process.env.NODE_ENV = "test";
      process.env.HTTP_PORT = process.env.HTTP_PORT ?? "8081";
      kernel = await init();
    }
  }

  @after()
  public resetScenarioState(): void {
    this.response = undefined;
  }

  @when("I GET {string}")
  public async iGet(path: string): Promise<void> {
    this.response = await this.restClient.get(path);
  }

  @when("I DELETE {string}")
  public async iDelete(path: string): Promise<void> {
    this.response = await this.restClient.delete(path);
  }

  @when("I PATCH {string} with body:")
  public async iPatchWithBody(path: string, body: string): Promise<void> {
    this.response = await this.restClient.patch(path, Definitions.parseBody(body));
  }

  @when("I POST {string} with body:")
  public async iPostWithBody(path: string, body: string): Promise<void> {
    this.response = await this.restClient.post(path, Definitions.parseBody(body));
  }

  @when("I PUT {string} with body:")
  public async iPutWithBody(path: string, body: string): Promise<void> {
    this.response = await this.restClient.put(path, Definitions.parseBody(body));
  }

  @then("response code is equal to {int}")
  public responseCodeIsEqualTo(status: number): void {
    expect(this.response).to.not.equal(undefined);
    expect(this.response.status).to.equal(status);
  }

  @then("response body is equal to:")
  public responseBodyIsEqualTo(body: string): void {
    expect(this.response).to.not.equal(undefined);
    expect(this.response?.data).to.deep.equal(Definitions.parseBody(body));
  }

  @then("response body contains {string}")
  public responseBodyContains(expected: string): void {
    expect(this.response).to.not.equal(undefined);
    expect(JSON.stringify(this.response?.data)).to.contain(expected);
  }

}
`;
}
