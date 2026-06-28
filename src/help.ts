export const help = `railgun

Usage:
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
  sync agents           Sync AGENTS.md from railgun.
  sync skills           Sync packaged DDD skills into .agents/skills.
`;
