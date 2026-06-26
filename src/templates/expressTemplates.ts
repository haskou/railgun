export function expressIndex(): string {
  return `/* eslint-disable no-console */
import { applicationRoutes } from '@app/apps/ApplicationRoutes';
import { ApplicationKernel } from '@app/shared/infrastructure/environment/ApplicationKernel';
import { dependencyInjectionOptions } from '@app/shared/infrastructure/environment/dependencyInjectionOptions';
import { environmentSchema } from '@app/shared/infrastructure/environment/environmentSchema';
import { Kernel } from '@haskou/ddd-kernel';
import { ExpressKernelServer, HttpErrorHandler } from '@haskou/ddd-kernel/express';
import 'reflect-metadata';

export async function init(): Promise<ApplicationKernel> {
  const kernel: ApplicationKernel = new Kernel({ environmentSchema });

  kernel.loadEnvironmentVariables();
  await kernel.dependencyInjection(dependencyInjectionOptions(kernel));
  kernel.registerRoutes(...applicationRoutes);

  const server = new ExpressKernelServer({
    controllers: kernel.getRoutes(),
    errorHandlers: [new HttpErrorHandler().handle],
    kernel,
    port: kernel.environment.HTTP_PORT,
  });

  kernel.registerShutdownHook(() => server.close());
  await server.run();

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

export function applicationRoutes(): string {
  return `import HealthRoute from '@app/shared/infrastructure/ui/routes/HealthRoute';
import { Route } from '@haskou/ddd-kernel/adapters/ui';

export const applicationRoutes: Array<new (...args: never[]) => Route> = [
  HealthRoute,
];
`;
}

export function healthRoute(): string {
  return `import { Route } from '@haskou/ddd-kernel/adapters/ui';
import { Response } from 'express';
import {
  Get as get,
  JsonController as jsonController,
  Res,
} from 'routing-controllers';

@jsonController()
export default class HealthRoute extends Route {
  @get('/health')
  public health(@Res() res: Response): object {
    return res.status(200).send().end();
  }

  @get('/')
  public index(): object {
    return {};
  }
}
`;
}
