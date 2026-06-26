export function npmWorkflow(nodeMajor: string): string {
  return `name: CI

on:
  pull_request:
    branches:
      - main
      - master
  push:
    branches:
      - main
      - master

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${nodeMajor}
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: yarn lint && yarn test:coverage
      - run: yarn build
`;
}

export function releaseBranchesReadmeSection(): string {
  return `## Release Branches

CI publishes npm versions from pull requests merged into the default branch
according to the source branch prefix:

| Branch prefix | npm version bump |
| ------------- | ---------------- |
| \`fix/*\`       | Patch            |
| \`feat/*\`      | Minor            |
| \`break/*\`     | Major            |

Other branch names run validation only and do not publish.
`;
}
