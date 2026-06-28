![](./logo.jpg)

# @haskou/railgun

[![CI](https://github.com/haskou/railgun/actions/workflows/ci.yml/badge.svg)](https://github.com/haskou/railgun/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@haskou/railgun.svg)](https://www.npmjs.com/package/@haskou/railgun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

CLI to initialize DDD projects with `@haskou/ddd-kernel` and add contexts and integrations.

## Installation

```bash
npm i -g @haskou/railgun
```

## Usage

```bash
  railgun init
  railgun add context <Name>
  railgun add ci
  railgun add docker
  railgun add docker-ci
  railgun add environment
  railgun add express
  railgun add npm
  railgun add renovate
  railgun sync agents
  railgun sync skills
  railgun help

Commands:
  init                  Initialize a DDD TypeScript project.
  add context <Name>    Add a generated DDD context.
  add ci                Add GitHub Actions CI and npm publishing workflow.
  add docker            Add Dockerfile and docker-compose.yml.
  add docker-ci         Add Docker build workflow and README badge.
  add environment       Add kernel environment files and .env defaults.
  add express           Add ExpressKernelServer and health route.
  add npm               Add npm CI/publishing workflow and README badges.
  add renovate          Add Renovate config and README badge.
  sync agents           Download AGENTS.md from ddd-engineer-skills.
  sync skills           Sync DDD skills into .agents/skills.
```

There is a `man railgun` available.

## Generated Structure

`railgun init` creates a TypeScript project prepared for DDD services:

```text
src/
  index.ts
  shared/
    infrastructure/
      environment/
        ApplicationKernel.ts
        dependencyInjectionOptions.ts
        environmentSchema.ts
tests/
  unit/
AGENTS.md
Dockerfile
docker-compose.yml
jest.config.ts
nodemon.json
tsconfig.json
```

The generated `src/index.ts` is the composition root. It creates the
`@haskou/ddd-kernel` kernel, loads environment variables, configures dependency
injection, and starts the optional Express runtime when that integration is
enabled.

Environment files live in `src/shared/infrastructure/environment` because they
are shared infrastructure, not app-specific code. The default schema includes
`NODE_ENV`, `HTTP_PORT`, and `ENABLE_SWAGGER`. Dependency injection only builds
the container automatically outside production.

## Generated Contexts

`railgun add context Foo` creates a context under `src/contexts/foo` with one
basic aggregate slice:

```text
src/contexts/foo/
  domain/
    Foo.ts
    errors/FooNotFoundError.ts
    events/FooCreatedEvent.ts
    repositories/FooRepository.ts
    services/FooDomainService.ts
    value-objects/FooId.ts
  application/
    create/FooCreator.ts
    create/messages/FooCreateMessage.ts
    delete/FooDeleter.ts
    delete/messages/FooDeleteMessage.ts
    find-by-id/FooByIdFinder.ts
    find-by-id/messages/FooFindByIdMessage.ts
  infrastructure/
    persistence/DummyFooRepository.ts
tests/unit/
  contexts/foo/
  mothers/FooMother.ts
```

The generated domain includes an aggregate root, its ID value object, a created
domain event, a repository interface, a domain service, and a not-found error.
Application use cases are generated with explicit message classes at the
application boundary. The infrastructure adapter is intentionally a dummy
repository so the first tests can run without choosing a database.

Generated files include `// TODO: Implement` placeholders where project-specific
behavior should replace the starter behavior.

## Express And API Tests

`railgun add express` updates the composition root to use
`ExpressKernelServer`, adds `ApplicationRoutes`, and creates a health route:

```text
src/apps/ApplicationRoutes.ts
src/shared/infrastructure/ui/routes/HealthRoute.ts
tests/api/features/health-api/GetHealthRoute.feature
tests/api/steps/Definitions.ts
tests/api/steps/RestClient.ts
```

The generated API test client supports `GET`, `POST`, `PUT`, `PATCH`, and
`DELETE`, uses `API_BASE_URL` when present, and exposes response status, body,
and headers to Cucumber step definitions.

## Integrations

`railgun add environment` creates the kernel environment files under
`src/shared/infrastructure/environment` and writes `.env.local` and `.env.test`.

`railgun add docker` creates `Dockerfile` and `docker-compose.yml` using the
current Node version resolved by railgun.

`railgun add docker-ci` creates `.github/workflows/docker.yml` to build the
Docker test and runtime targets, and adds the Docker workflow badge to
`README.md`.

`railgun add ci` and `railgun add npm` create `.github/workflows/ci.yml`, add CI
and npm badges to `README.md`, and document the release branch prefixes used by
the workflow.

`railgun add renovate` creates `renovate.json` and adds the Renovate badge.

`railgun sync agents` downloads `AGENTS.md` from
`https://github.com/haskou/ddd-engineer-skills.git`.

`railgun sync skills` downloads the DDD skills from
`https://github.com/haskou/ddd-engineer-skills.git` and copies them into
`.agents/skills`.

## Release Branches

CI publishes npm versions from pull requests merged into the default branch
according to the source branch prefix:

| Branch prefix | npm version bump |
| ------------- | ---------------- |
| `fix/*`       | Patch            |
| `feat/*`      | Minor            |
| `break/*`     | Major            |

Other branch names run validation only and do not publish.

## License

MIT. See [LICENSE](LICENSE).

## Disclaimer

@haskou/railgun is not affiliated with, endorsed by, or sponsored by NEXON, NEXON Games, Yostar, or the Blue Archive team.
