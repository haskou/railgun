import { mutatePackage, write } from "../filesystem";
import {
  apiDefinitions,
  cucumberConfig,
  healthFeature,
  restClient,
} from "../templates/apiTestTemplates";
import {
  applicationRoutes,
  expressIndex,
  healthRoute,
} from "../templates/expressTemplates";

export function addExpress(root: string): void {
  // Package mutation is inherently dense because it patches related Express tooling together.
  // eslint-disable-next-line complexity
  mutatePackage(root, (pkg) => {
    pkg.dependencies = {
      ...(pkg.dependencies ?? {}),
      axios: pkg.dependencies?.axios ?? "^1.6.7",
      "class-transformer": pkg.dependencies?.["class-transformer"] ?? "^0.5.1",
      "class-validator": pkg.dependencies?.["class-validator"] ?? "^0.15.1",
      cors: pkg.dependencies?.cors ?? "^2.8.6",
      express: pkg.dependencies?.express ?? "^5.2.1",
      "routing-controllers":
        pkg.dependencies?.["routing-controllers"] ?? "^0.11.3",
    };
    pkg.devDependencies = {
      ...(pkg.devDependencies ?? {}),
      "@cucumber/cucumber":
        pkg.devDependencies?.["@cucumber/cucumber"] ?? "7.3.2",
      "@types/chai": pkg.devDependencies?.["@types/chai"] ?? "^5.2.3",
      "@types/cors": pkg.devDependencies?.["@types/cors"] ?? "^2.8.19",
      "@types/express": pkg.devDependencies?.["@types/express"] ?? "^5.0.6",
      chai: pkg.devDependencies?.chai ?? "^6.2.2",
      "cucumber-tsflow":
        pkg.devDependencies?.["cucumber-tsflow"] ?? "^4.0.0-preview.7",
    };
    pkg.scripts = {
      ...(pkg.scripts ?? {}),
      "test:api": "NODE_ENV=test cucumber-js -p api --publish-quiet",
      "test:api:only":
        "NODE_ENV=test cucumber-js -p api --publish-quiet --tags @Only",
    };

    return pkg;
  });

  write(root, "cucumber.js", cucumberConfig());
  write(root, "src/apps/ApplicationRoutes.ts", applicationRoutes());
  write(
    root,
    "src/shared/infrastructure/ui/routes/HealthRoute.ts",
    healthRoute(),
  );
  write(root, "src/index.ts", expressIndex());
  write(
    root,
    "tests/api/features/health-api/GetHealthRoute.feature",
    healthFeature(),
  );
  write(root, "tests/api/steps/Definitions.ts", apiDefinitions());
  write(root, "tests/api/steps/RestClient.ts", restClient());
  console.log("Added Express integration");
}
