import { write, writeJson } from "../filesystem";
import { askProjectAnswers, ProjectAnswers } from "../projectAnswers";
import {
  basicIndex,
  nodemonConfig,
  projectBuildTsconfig,
  projectGitignore,
  projectJestConfig,
  projectJestTsconfig,
  projectLicense,
  projectReadme,
  projectTsconfig,
} from "../templates/projectTemplates";
import {
  PackageVersions,
  pinned,
  requiredPackages,
  resolvePackageVersions,
} from "../versions";
import { addDocker } from "./addDocker";
import { addEnvironment } from "./addEnvironment";
import { addExpress } from "./addExpress";
import { addNpm } from "./addNpm";
import { addRenovate } from "./addRenovate";
import { syncAgents } from "./syncAgents";
import { syncSkills } from "./syncSkills";

export async function initProject(root: string): Promise<void> {
  const answers = await askProjectAnswers(root);
  const versions = resolvePackageVersions();

  writeProjectBase(root, answers, versions);
  syncAgents(root);
  syncSkills(root);
  addEnvironment(root);

  if (answers.docker) {
    addDocker(root, answers.name);
  }

  if (answers.express) {
    addExpress(root);
  }

  if (answers.npm) {
    addNpm(root, answers.name);
  }

  if (answers.renovate) {
    addRenovate(root);
  }

  console.log(`Initialized ${answers.name}`);

  const missing = requiredPackages.filter(
    (packageName) => !versions[packageName],
  );

  if (missing.length > 0) {
    console.log(`Could not resolve versions for: ${missing.join(", ")}`);
    console.log(
      "Add them manually with a concrete version if they are available in your registry.",
    );
  }
}

function writeProjectBase(
  root: string,
  answers: ProjectAnswers,
  versions: PackageVersions,
): void {
  const dependencies: Record<string, string> = {
    "@haskou/ddd-kernel": "^1.2.0",
    "@haskou/value-objects": pinned(versions["@haskou/value-objects"]),
    dotenv: "^17.3.1",
    "reflect-metadata": "^0.2.2",
  };

  if (answers.express) {
    dependencies.axios = "^1.6.7";
    dependencies["class-transformer"] = "^0.5.1";
    dependencies["class-validator"] = "^0.15.1";
    dependencies.cors = "^2.8.6";
    dependencies.express = "^5.2.1";
    dependencies["routing-controllers"] = "^0.11.3";
  }

  const devDependencies: Record<string, string> = {
    "@faker-js/faker": "^10.3.0",
    "@haskou/eslint-config": pinned(versions["@haskou/eslint-config"]),
    "@types/jest": "^30.0.0",
    "@types/node": "^25.3.5",
    eslint: "^10.5.0",
    jest: "^30.2.0",
    "jest-mock-extended": "^4.0.0",
    nodemon: "^3.1.14",
    "npm-run-all": "^4.1.5",
    prettier: "^3.8.4",
    "ts-jest": "^29.4.6",
    "ts-node": "^10.9.2",
    "ts-patch": "^3.3.0",
    "tsconfig-paths": "^4.2.0",
    tsx: "^4.21.0",
    typescript: "^6.0.3",
    "typescript-transform-paths": "^3.5.6",
  };

  if (answers.express) {
    devDependencies["@cucumber/cucumber"] = "7.3.2";
    devDependencies["@types/cors"] = "^2.8.19";
    devDependencies["@types/express"] = "^5.0.6";
    devDependencies["@types/chai"] = "^5.2.3";
    devDependencies.chai = "^6.2.2";
    devDependencies["cucumber-tsflow"] = "^4.0.0-preview.7";
  }

  writeJson(root, "package.json", {
    author: "",
    dependencies,
    description: answers.description,
    devDependencies,
    keywords: [],
    license: answers.license,
    name: answers.name,
    scripts: {
      build: "ts-patch install && tsc --project tsconfig.build.json",
      lint: "eslint ./src ./tests --ext .ts",
      "lint:fix": "eslint ./src ./tests --ext .ts --fix",
      local: "nodemon",
      "local:start":
        "node --inspect=0.0.0.0:9229 -r ts-node/register -r tsconfig-paths/register src/index.ts",
      "pack:dry": "npm pack --dry-run",
      start: "node dist/index.js",
      test: "npm-run-all lint test:unit",
      "test:unit": "jest --passWithNoTests",
      ...(answers.express
        ? {
            "test:api": "NODE_ENV=test cucumber-js -p api --publish-quiet",
            "test:api:only":
              "NODE_ENV=test cucumber-js -p api --publish-quiet --tags @Only",
          }
        : {}),
      "test:ci": "npm-run-all test:unit",
      "test:coverage": "jest --collect-coverage --runInBand",
    },
    version: "0.1.0",
  });

  write(root, "tsconfig.json", projectTsconfig());
  write(root, "tsconfig.build.json", projectBuildTsconfig());
  write(root, "tsconfig.jest.json", projectJestTsconfig());
  write(root, "jest.config.ts", projectJestConfig());
  write(root, "nodemon.json", nodemonConfig());
  write(
    root,
    "eslint.config.mjs",
    "import config from '@haskou/eslint-config';\n\nexport default config;\n",
  );
  write(root, ".gitignore", projectGitignore());
  write(root, "README.md", projectReadme(answers));
  write(root, "LICENSE", projectLicense(answers));
  write(root, "src/index.ts", basicIndex());
}
