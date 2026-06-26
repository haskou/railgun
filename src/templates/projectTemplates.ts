import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function projectTsconfig(): string {
  return `{
  "compilerOptions": {
    "module": "commonjs",
    "allowJs": false,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "target": "es6",
    "ignoreDeprecations": "6.0",
    "strict": false,
    "strictNullChecks": false,
    "strictPropertyInitialization": false,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "inlineSourceMap": true,
    "baseUrl": "./",
    "importHelpers": true,
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": ["es6", "es2021", "esnext", "dom"],
    "types": ["node", "reflect-metadata", "jest"],
    "paths": {
      "@app/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*", "config/**/*"],
  "exclude": ["node_modules"],
  "ts-node": {
    "files": true
  }
}
`;
}

export function projectBuildTsconfig(): string {
  return `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "dist",
    "plugins": [
      {
        "transform": "typescript-transform-paths"
      }
    ]
  },
  "exclude": ["node_modules", "tests", "**/*.spec.ts"]
}
`;
}

export function projectJestTsconfig(): string {
  return `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2022",
    "lib": ["es2022"]
  }
}
`;
}

export function projectJestConfig(): string {
  return `import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  maxWorkers: '50%',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\\\.[tj]s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@noble|@haskou|@faker-js)/)'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
  },
  verbose: true,
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  setupFiles: ['reflect-metadata'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  coverageReporters: ['json'],
  coverageDirectory: '<rootDir>/coverage/unit',
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', 'src/index.ts'],
};

export default config;
`;
}

export function nodemonConfig(): string {
  return `{
  "watch": ["src"],
  "ext": "ts,json",
  "exec": "yarn local:start"
}
`;
}

export function projectGitignore(): string {
  return `node_modules
dist
coverage
.npmrc
.DS_Store
.vscode/
.cache
`;
}

export function agentsMd(): string {
  const candidates = [
    join(__dirname, "..", "..", "AGENTS.md"),
    join(__dirname, "..", "AGENTS.md"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf8");
    }
  }

  throw new Error("Cannot find railgun AGENTS.md to copy into the project.");
}

export function projectReadme(project: {
  readonly description: string;
  readonly license: string;
  readonly name: string;
}): string {
  const license = encodeURIComponent(project.license);

  return `[![License: ${project.license}](https://img.shields.io/badge/license-${license}-blue.svg)](LICENSE)

# ${project.name}

${project.description}

## Commands

\`\`\`bash
railgun init
railgun add context Foo
railgun add express
railgun add npm
railgun add renovate
railgun help
man railgun
\`\`\`

## License

${project.license}. See [LICENSE](LICENSE).
`;
}

export function projectLicense(project: {
  readonly license: string;
  readonly name: string;
}): string {
  if (project.license !== "MIT") {
    return `${project.license}\n`;
  }

  return `MIT License

Copyright (c) ${new Date().getFullYear()} ${project.name}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

export function basicIndex(): string {
  return `/* eslint-disable no-console */
import { ApplicationKernel } from '@app/shared/infrastructure/environment/ApplicationKernel';
import { dependencyInjectionOptions } from '@app/shared/infrastructure/environment/dependencyInjectionOptions';
import { environmentSchema } from '@app/shared/infrastructure/environment/environmentSchema';
import { Kernel } from '@haskou/ddd-kernel';
import 'reflect-metadata';

export async function init(): Promise<ApplicationKernel> {
  const kernel: ApplicationKernel = new Kernel({ environmentSchema });

  kernel.loadEnvironmentVariables();
  await kernel.dependencyInjection(dependencyInjectionOptions(kernel));

  return kernel;
}

if (require.main === module) {
  init()
    .then(() => {
      console.info('Application started');
    })
    .catch((error) => {
      console.error('Application error', error);
      process.exitCode = 1;
    });
}
`;
}
