import { NameSet } from "../naming";

export function valueObjectTemplate(context: NameSet): string {
  return `import { UUID } from "@haskou/value-objects";

export class ${context.pascal}Id extends UUID {
  // TODO: Implement
}
`;
}

export function createdEventTemplate(context: NameSet): string {
  return `import { DomainEvent } from "@haskou/ddd-kernel/domain";

export class ${context.pascal}CreatedEvent extends DomainEvent {
  // TODO: Implement

  public static EVENT_NAME = "${context.kebab}.v1.${context.kebab}.created";

  public eventName(): string {
    return ${context.pascal}CreatedEvent.EVENT_NAME;
  }
}
`;
}

export function aggregateTemplate(context: NameSet): string {
  return `import { AggregateRoot } from "@haskou/ddd-kernel/domain";
import { PrimitiveOf } from "@haskou/value-objects";

import { ${context.pascal}CreatedEvent } from "./events/${context.pascal}CreatedEvent";
import { ${context.pascal}Id } from "./value-objects/${context.pascal}Id";

export class ${context.pascal} extends AggregateRoot {
  // TODO: Implement

  public static create(id: ${context.pascal}Id = ${context.pascal}Id.generate()): ${context.pascal} {
    const ${context.camel} = new ${context.pascal}(id);

    ${context.camel}.record(new ${context.pascal}CreatedEvent(id.toString()));

    return ${context.camel};
  }

  public static fromPrimitives(primitives: PrimitiveOf<${context.pascal}>): ${context.pascal} {
    return new ${context.pascal}(new ${context.pascal}Id(primitives.id));
  }

  constructor(private readonly id: ${context.pascal}Id) {
    super();
  }

  public is(id: ${context.pascal}Id): boolean {
    return this.id.isEqual(id);
  }

  public toPrimitives(): { id: string } {
    return {
      id: this.id.toString(),
    };
  }
}
`;
}

export function repositoryTemplate(context: NameSet): string {
  return `import { ${context.pascal} } from "../${context.pascal}";
import { ${context.pascal}Id } from "../value-objects/${context.pascal}Id";

export default interface ${context.pascal}Repository {
  // TODO: Implement

  delete(id: ${context.pascal}Id): Promise<void>;
  findById(id: ${context.pascal}Id): Promise<${context.pascal} | undefined>;
  save(${context.camel}: ${context.pascal}): Promise<void>;
}
`;
}

export function domainServiceTemplate(context: NameSet): string {
  return `import { ${context.pascal} } from "../${context.pascal}";
import ${context.pascal}Repository from "../repositories/${context.pascal}Repository";
import { ${context.pascal}Id } from "../value-objects/${context.pascal}Id";

export default class ${context.pascal}DomainService {
  // TODO: Implement

  constructor(private readonly repository: ${context.pascal}Repository) {}

  public async exists(id: ${context.pascal}Id): Promise<boolean> {
    return (await this.repository.findById(id)) !== undefined;
  }

  public async persist(${context.camel}: ${context.pascal}): Promise<void> {
    await this.repository.save(${context.camel});
  }
}
`;
}

export function notFoundErrorTemplate(context: NameSet): string {
  return `import { BaseError } from "@haskou/ddd-kernel/domain";

export class ${context.pascal}NotFoundError extends BaseError {
  // TODO: Implement

  constructor() {
    super("${context.pascal} not found");
  }
}
`;
}

export function findByIdMessageTemplate(context: NameSet): string {
  return `import { ${context.pascal}Id } from "../../../domain/value-objects/${context.pascal}Id";

export class ${context.pascal}FindByIdMessage {
  // TODO: Implement

  public readonly id: ${context.pascal}Id;

  constructor(id: string) {
    this.id = new ${context.pascal}Id(id);
  }
}
`;
}

export function finderTemplate(context: NameSet): string {
  return `import { ${context.pascal}NotFoundError } from "../../domain/errors/${context.pascal}NotFoundError";
import { ${context.pascal} } from "../../domain/${context.pascal}";
import ${context.pascal}Repository from "../../domain/repositories/${context.pascal}Repository";
import { ${context.pascal}FindByIdMessage } from "./messages/${context.pascal}FindByIdMessage";

export class ${context.pascal}ByIdFinder {
  // TODO: Implement

  constructor(private readonly repository: ${context.pascal}Repository) {}

  public async find(message: ${context.pascal}FindByIdMessage): Promise<${context.pascal}> {
    const ${context.camel} = await this.repository.findById(message.id);

    if (!${context.camel}) {
      throw new ${context.pascal}NotFoundError();
    }

    return ${context.camel};
  }
}
`;
}

export function createMessageTemplate(context: NameSet): string {
  return `import { ${context.pascal}Id } from "../../../domain/value-objects/${context.pascal}Id";

export class ${context.pascal}CreateMessage {
  // TODO: Implement

  public readonly id: ${context.pascal}Id;

  constructor(id?: string) {
    this.id = id ? new ${context.pascal}Id(id) : ${context.pascal}Id.generate();
  }
}
`;
}

export function creatorTemplate(context: NameSet): string {
  return `import { DomainEventPublisher } from "@haskou/ddd-kernel/domain";

import { ${context.pascal} } from "../../domain/${context.pascal}";
import ${context.pascal}Repository from "../../domain/repositories/${context.pascal}Repository";
import { ${context.pascal}CreateMessage } from "./messages/${context.pascal}CreateMessage";

export class ${context.pascal}Creator {
  // TODO: Implement

  constructor(
    private readonly repository: ${context.pascal}Repository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  public async create(message: ${context.pascal}CreateMessage): Promise<${context.pascal}> {
    const ${context.camel} = ${context.pascal}.create(message.id);

    await this.repository.save(${context.camel});
    await this.eventPublisher.publish(${context.camel}.pullDomainEvents());

    return ${context.camel};
  }
}
`;
}

export function deleteMessageTemplate(context: NameSet): string {
  return `import { ${context.pascal}Id } from "../../../domain/value-objects/${context.pascal}Id";

export class ${context.pascal}DeleteMessage {
  // TODO: Implement

  public readonly id: ${context.pascal}Id;

  constructor(id: string) {
    this.id = new ${context.pascal}Id(id);
  }
}
`;
}

export function deleterTemplate(context: NameSet): string {
  return `import ${context.pascal}Repository from "../../domain/repositories/${context.pascal}Repository";
import { ${context.pascal}DeleteMessage } from "./messages/${context.pascal}DeleteMessage";

export class ${context.pascal}Deleter {
  // TODO: Implement

  constructor(private readonly repository: ${context.pascal}Repository) {}

  public async delete(message: ${context.pascal}DeleteMessage): Promise<void> {
    await this.repository.delete(message.id);
  }
}
`;
}

export function dummyRepositoryTemplate(context: NameSet): string {
  return `import { ${context.pascal} } from "../../domain/${context.pascal}";
import ${context.pascal}Repository from "../../domain/repositories/${context.pascal}Repository";
import { ${context.pascal}Id } from "../../domain/value-objects/${context.pascal}Id";

export class Dummy${context.pascal}Repository implements ${context.pascal}Repository {
  // TODO: Implement

  private readonly ${context.camel}s = new Map<string, ${context.pascal}>();

  public delete(id: ${context.pascal}Id): Promise<void> {
    this.${context.camel}s.delete(id.toString());

    return Promise.resolve();
  }

  public findById(id: ${context.pascal}Id): Promise<${context.pascal} | undefined> {
    return Promise.resolve(this.${context.camel}s.get(id.toString()));
  }

  public save(${context.camel}: ${context.pascal}): Promise<void> {
    this.${context.camel}s.set(${context.camel}.toPrimitives().id, ${context.camel});

    return Promise.resolve();
  }
}
`;
}

export function motherTemplate(context: NameSet): string {
  return `import { ${context.pascal} } from "@app/contexts/${context.kebab}/domain/${context.pascal}";
import { ${context.pascal}Id } from "@app/contexts/${context.kebab}/domain/value-objects/${context.pascal}Id";

export class ${context.pascal}Mother {
  // TODO: Implement

  public id: ${context.pascal}Id = ${context.pascal}Id.generate();

  public build(): ${context.pascal} {
    return ${context.pascal}.create(this.id);
  }

  public withId(id: ${context.pascal}Id): this {
    this.id = id;

    return this;
  }
}
`;
}

export function aggregateSpecTemplate(context: NameSet): string {
  return `import { ${context.pascal}CreatedEvent } from "@app/contexts/${context.kebab}/domain/events/${context.pascal}CreatedEvent";
import { ${context.pascal} } from "@app/contexts/${context.kebab}/domain/${context.pascal}";
import { ${context.pascal}Id } from "@app/contexts/${context.kebab}/domain/value-objects/${context.pascal}Id";

import { ${context.pascal}Mother } from "../../../mothers/${context.pascal}Mother";

describe("${context.pascal}", () => {
  let id: ${context.pascal}Id;
  let mother: ${context.pascal}Mother;

  beforeEach(() => {
    id = ${context.pascal}Id.generate();
    mother = new ${context.pascal}Mother().withId(id);
  });

  it("should be constructed with the requested id", () => {
    const ${context.camel} = new ${context.pascal}(id);

    expect(${context.camel}.is(id)).toBe(true);
  });

  it("should create a ${context.camel} with the requested id", () => {
    const ${context.camel} = mother.build();

    expect(${context.camel}.is(id)).toBe(true);
  });

  it("should serialize to primitives", () => {
    const ${context.camel} = mother.build();

    expect(${context.camel}.toPrimitives()).toEqual({
      id: id.toString(),
    });
  });

  it("should record a created domain event", () => {
    const ${context.camel} = mother.build();

    expect(${context.camel}.pullDomainEvents()).toEqual([
      expect.any(${context.pascal}CreatedEvent),
    ]);
  });
});
`;
}

export function domainServiceSpecTemplate(context: NameSet): string {
  return `import ${context.pascal}DomainService from "@app/contexts/${context.kebab}/domain/services/${context.pascal}DomainService";
import { ${context.pascal}Id } from "@app/contexts/${context.kebab}/domain/value-objects/${context.pascal}Id";
import { Dummy${context.pascal}Repository } from "@app/contexts/${context.kebab}/infrastructure/persistence/Dummy${context.pascal}Repository";

import { ${context.pascal}Mother } from "../../../../mothers/${context.pascal}Mother";

describe("${context.pascal}DomainService", () => {
  let mother: ${context.pascal}Mother;
  let repository: Dummy${context.pascal}Repository;
  let service: ${context.pascal}DomainService;

  beforeEach(() => {
    mother = new ${context.pascal}Mother();
    repository = new Dummy${context.pascal}Repository();
    service = new ${context.pascal}DomainService(repository);
  });

  it("should persist and detect an existing ${context.camel}", async () => {
    const id = ${context.pascal}Id.generate();
    const ${context.camel} = mother.withId(id).build();

    await service.persist(${context.camel});

    expect(await service.exists(id)).toBe(true);
  });

  it("should report missing ${context.camel}s as not existing", async () => {
    expect(await service.exists(${context.pascal}Id.generate())).toBe(false);
  });
});
`;
}

export function creatorSpecTemplate(context: NameSet): string {
  return `import { ${context.pascal}Creator } from "@app/contexts/${context.kebab}/application/create/${context.pascal}Creator";
import { ${context.pascal}CreateMessage } from "@app/contexts/${context.kebab}/application/create/messages/${context.pascal}CreateMessage";
import { ${context.pascal}CreatedEvent } from "@app/contexts/${context.kebab}/domain/events/${context.pascal}CreatedEvent";
import ${context.pascal}Repository from "@app/contexts/${context.kebab}/domain/repositories/${context.pascal}Repository";
import { ${context.pascal}Id } from "@app/contexts/${context.kebab}/domain/value-objects/${context.pascal}Id";
import { DomainEventPublisher } from "@haskou/ddd-kernel/domain";
import { mock, MockProxy } from "jest-mock-extended";

describe("${context.pascal}Creator", () => {
  let creator: ${context.pascal}Creator;
  let eventPublisher: MockProxy<DomainEventPublisher>;
  let repository: MockProxy<${context.pascal}Repository>;

  beforeEach(() => {
    eventPublisher = mock<DomainEventPublisher>();
    repository = mock<${context.pascal}Repository>();
    creator = new ${context.pascal}Creator(repository, eventPublisher);
  });

  it("should create, persist and publish a ${context.camel}", async () => {
    const id = ${context.pascal}Id.generate();

    const ${context.camel} = await creator.create(new ${context.pascal}CreateMessage(id.toString()));

    expect(${context.camel}.is(id)).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(${context.camel});
    expect(eventPublisher.publish).toHaveBeenCalledWith([
      expect.any(${context.pascal}CreatedEvent),
    ]);
  });
});
`;
}

export function finderSpecTemplate(context: NameSet): string {
  return `import { ${context.pascal}ByIdFinder } from "@app/contexts/${context.kebab}/application/find-by-id/${context.pascal}ByIdFinder";
import { ${context.pascal}FindByIdMessage } from "@app/contexts/${context.kebab}/application/find-by-id/messages/${context.pascal}FindByIdMessage";
import { ${context.pascal}NotFoundError } from "@app/contexts/${context.kebab}/domain/errors/${context.pascal}NotFoundError";
import { ${context.pascal}Id } from "@app/contexts/${context.kebab}/domain/value-objects/${context.pascal}Id";
import { Dummy${context.pascal}Repository } from "@app/contexts/${context.kebab}/infrastructure/persistence/Dummy${context.pascal}Repository";

import { ${context.pascal}Mother } from "../../../mothers/${context.pascal}Mother";

describe("${context.pascal}ByIdFinder", () => {
  let finder: ${context.pascal}ByIdFinder;
  let mother: ${context.pascal}Mother;
  let repository: Dummy${context.pascal}Repository;

  beforeEach(() => {
    mother = new ${context.pascal}Mother();
    repository = new Dummy${context.pascal}Repository();
    finder = new ${context.pascal}ByIdFinder(repository);
  });

  it("should find a ${context.camel} by id", async () => {
    const id = ${context.pascal}Id.generate();
    const ${context.camel} = mother.withId(id).build();

    ${context.camel}.pullDomainEvents();
    await repository.save(${context.camel});

    await expect(finder.find(new ${context.pascal}FindByIdMessage(id.toString()))).resolves.toBe(${context.camel});
  });

  it("should fail when the ${context.camel} does not exist", async () => {
    await expect(
      finder.find(new ${context.pascal}FindByIdMessage(${context.pascal}Id.generate().toString())),
    ).rejects.toThrow(${context.pascal}NotFoundError);
  });
});
`;
}

export function deleterSpecTemplate(context: NameSet): string {
  return `import { ${context.pascal}Deleter } from "@app/contexts/${context.kebab}/application/delete/${context.pascal}Deleter";
import { ${context.pascal}DeleteMessage } from "@app/contexts/${context.kebab}/application/delete/messages/${context.pascal}DeleteMessage";
import { ${context.pascal}Id } from "@app/contexts/${context.kebab}/domain/value-objects/${context.pascal}Id";
import { Dummy${context.pascal}Repository } from "@app/contexts/${context.kebab}/infrastructure/persistence/Dummy${context.pascal}Repository";

import { ${context.pascal}Mother } from "../../../mothers/${context.pascal}Mother";

describe("${context.pascal}Deleter", () => {
  let deleter: ${context.pascal}Deleter;
  let mother: ${context.pascal}Mother;
  let repository: Dummy${context.pascal}Repository;

  beforeEach(() => {
    mother = new ${context.pascal}Mother();
    repository = new Dummy${context.pascal}Repository();
    deleter = new ${context.pascal}Deleter(repository);
  });

  it("should delete a ${context.camel} by id", async () => {
    const id = ${context.pascal}Id.generate();
    const ${context.camel} = mother.withId(id).build();

    ${context.camel}.pullDomainEvents();
    await repository.save(${context.camel});
    await deleter.delete(new ${context.pascal}DeleteMessage(id.toString()));

    expect(await repository.findById(id)).toBeUndefined();
  });
});
`;
}
