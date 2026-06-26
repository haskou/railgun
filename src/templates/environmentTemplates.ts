export function environmentSchemaTemplate(): string {
  return `export const environmentSchema = {
  ENABLE_SWAGGER: { defaultValue: false, type: 'boolean' },
  HTTP_PORT: { required: true, type: 'number' },
  NODE_ENV: { defaultValue: 'local', type: 'string' },
} as const;
`;
}

export function applicationKernelTemplate(): string {
  return `import { Kernel } from '@haskou/ddd-kernel';

import { environmentSchema } from './environmentSchema';

export type ApplicationKernel = Kernel<typeof environmentSchema>;
`;
}

export function dependencyInjectionOptionsTemplate(): string {
  return `import { ApplicationKernel } from './ApplicationKernel';

export function dependencyInjectionOptions(kernel: ApplicationKernel): {
  readonly containerBuild: boolean;
} {
  return {
    containerBuild: kernel.environment.NODE_ENV !== 'production',
  };
}
`;
}
