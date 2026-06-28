import { write } from "../filesystem";
import {
  applicationKernelTemplate,
  dependencyInjectionOptionsTemplate,
  environmentSchemaTemplate,
} from "../templates/environmentTemplates";

export function addEnvironment(root: string): void {
  write(
    root,
    "src/shared/infrastructure/environment/ApplicationKernel.ts",
    applicationKernelTemplate(),
  );
  write(
    root,
    "src/shared/infrastructure/environment/dependencyInjectionOptions.ts",
    dependencyInjectionOptionsTemplate(),
  );
  write(
    root,
    "src/shared/infrastructure/environment/environmentSchema.ts",
    environmentSchemaTemplate(),
  );
  write(
    root,
    ".env.local",
    "NODE_ENV=local\nHTTP_PORT=8080\nENABLE_SWAGGER=false\n",
  );
  write(
    root,
    ".env.test",
    "NODE_ENV=test\nHTTP_PORT=8081\nENABLE_SWAGGER=false\n",
  );
  console.log("Added environment config.");
}
