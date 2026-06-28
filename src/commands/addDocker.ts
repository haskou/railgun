import { write } from "../filesystem";
import { dockerCompose, dockerfile } from "../templates/dockerTemplates";
import { resolveNodeVersion } from "../versions";

export function addDocker(root: string, projectName = "railgun"): void {
  write(root, "Dockerfile", dockerfile(resolveNodeVersion()));
  write(root, "docker-compose.yml", dockerCompose(projectName));
  console.log("Added Docker config.");
}
