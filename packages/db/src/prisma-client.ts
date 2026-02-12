let prismaClientPromise: Promise<any | null> | null = null;

function isEdgeRuntime(): boolean {
  return typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
}

async function resolveDefaultDatabaseUrl(): Promise<string> {
  const pathModule = await import('node:path');
  const fsModule = await import('node:fs');
  const cwd = process.cwd();

  const candidates = [
    pathModule.resolve(cwd, 'packages', 'db', 'prisma', 'dev.db'),
    pathModule.resolve(cwd, '..', 'packages', 'db', 'prisma', 'dev.db'),
    pathModule.resolve(cwd, '..', '..', 'packages', 'db', 'prisma', 'dev.db'),
  ];

  for (const candidate of candidates) {
    if (fsModule.existsSync(candidate)) {
      const normalized = candidate.replace(/\\/g, '/');
      return `file:${normalized}`;
    }
  }

  return 'file:./packages/db/prisma/dev.db';
}

export async function getPrismaClient(): Promise<any | null> {
  if (isEdgeRuntime()) {
    return null;
  }

  if (!prismaClientPromise) {
    prismaClientPromise = (async () => {
      try {
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL = await resolveDefaultDatabaseUrl();
        }

        const dynamicImport = new Function('moduleName', 'return import(moduleName);') as (
          moduleName: string
        ) => Promise<{ PrismaClient?: new () => any }>;
        const prismaModule = await dynamicImport('@prisma/client');
        if (!prismaModule.PrismaClient) {
          return null;
        }

        const { PrismaClient } = prismaModule;
        const globalWithPrisma = globalThis as { __realEstatePrismaClient?: any };
        globalWithPrisma.__realEstatePrismaClient ??= new PrismaClient();
        return globalWithPrisma.__realEstatePrismaClient;
      } catch {
        return null;
      }
    })();
  }

  return prismaClientPromise;
}
