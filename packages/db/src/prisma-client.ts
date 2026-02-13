let prismaClientPromise: Promise<any | null> | null = null;
let prismaRuntimeReason: 'edge_runtime' | 'missing_engine' | 'import_failed' | null = null;
let prismaRuntimeMessage: string | null = null;

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

async function hasPrismaQueryEngineArtifact(): Promise<boolean> {
  const pathModule = await import('node:path');
  const fsModule = await import('node:fs');
  const candidateDirs = await resolveGeneratedClientDirs();

  for (const directory of candidateDirs) {
    if (!fsModule.existsSync(directory)) {
      continue;
    }

    try {
      const files = fsModule.readdirSync(directory);
      const hasEngineBinary = files.some((name) =>
        /(query_engine|libquery_engine).*?(\.node|\.so|\.dylib|\.dll\.node|\.exe)$/i.test(name)
      );
      if (hasEngineBinary) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

async function resolveGeneratedClientDirs(): Promise<string[]> {
  const pathModule = await import('node:path');
  const cwd = process.cwd();

  return [
    pathModule.resolve(cwd, 'packages', 'db', 'generated', 'prisma-client'),
    pathModule.resolve(cwd, '..', 'packages', 'db', 'generated', 'prisma-client'),
    pathModule.resolve(cwd, '..', '..', 'packages', 'db', 'generated', 'prisma-client'),
    pathModule.resolve(cwd, 'generated', 'prisma-client'),
    pathModule.resolve(cwd, '..', 'generated', 'prisma-client'),
  ];
}

async function resolveGeneratedClientEntry(): Promise<string | null> {
  const pathModule = await import('node:path');
  const fsModule = await import('node:fs');

  const candidateDirs = await resolveGeneratedClientDirs();
  for (const directory of candidateDirs) {
    const entry = pathModule.resolve(directory, 'index.js');
    if (fsModule.existsSync(entry)) {
      return entry;
    }
  }

  return null;
}

export interface PrismaClientAvailability {
  available: boolean;
  reason: 'edge_runtime' | 'missing_engine' | 'import_failed' | null;
  message: string | null;
}

function isMissingEngineDatasourceError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('URL must start with the protocol `prisma://` or `prisma+postgres://`');
}

export function getPrismaClientAvailability(): PrismaClientAvailability {
  return {
    available: prismaRuntimeReason === null,
    reason: prismaRuntimeReason,
    message: prismaRuntimeMessage,
  };
}

export async function getPrismaClient(): Promise<any | null> {
  if (isEdgeRuntime()) {
    prismaRuntimeReason = 'edge_runtime';
    prismaRuntimeMessage = 'Prisma client is unavailable in edge runtime.';
    return null;
  }

  if (!prismaClientPromise) {
    prismaClientPromise = (async () => {
      try {
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL = await resolveDefaultDatabaseUrl();
        }

        const hasEngineBinary = await hasPrismaQueryEngineArtifact();
        if (!hasEngineBinary) {
          prismaRuntimeReason = 'missing_engine';
          prismaRuntimeMessage =
            'Prisma query engine artifacts are missing. Ingestion scripts require full-engine generation; run npm run db:generate:direct --workspace @real-estate/db.';
          return null;
        }

        const generatedClientEntry = await resolveGeneratedClientEntry();
        if (!generatedClientEntry) {
          prismaRuntimeReason = 'missing_engine';
          prismaRuntimeMessage =
            'Generated Prisma client was not found. Run npm run db:generate:direct --workspace @real-estate/db.';
          return null;
        }

        const { pathToFileURL } = await import('node:url');
        const dynamicImport = new Function('moduleName', 'return import(moduleName);') as (
          moduleName: string
        ) => Promise<{ PrismaClient?: new () => any }>;
        const prismaModule = await dynamicImport(pathToFileURL(generatedClientEntry).href);
        if (!prismaModule.PrismaClient) {
          prismaRuntimeReason = 'import_failed';
          prismaRuntimeMessage = 'Unable to resolve PrismaClient from generated Prisma client output.';
          return null;
        }

        const { PrismaClient } = prismaModule;
        const globalWithPrisma = globalThis as { __realEstatePrismaClient?: any };
        globalWithPrisma.__realEstatePrismaClient ??= new PrismaClient();
        try {
          await globalWithPrisma.__realEstatePrismaClient.$queryRawUnsafe('SELECT 1');
        } catch (error) {
          if (isMissingEngineDatasourceError(error)) {
            prismaRuntimeReason = 'missing_engine';
            prismaRuntimeMessage =
              'Prisma client is generated without local query engine support in this environment. Ingestion scripts require full-engine generation; run npm run db:generate:direct --workspace @real-estate/db.';
            return null;
          }
          throw error;
        }
        prismaRuntimeReason = null;
        prismaRuntimeMessage = null;
        return globalWithPrisma.__realEstatePrismaClient;
      } catch (error) {
        prismaRuntimeReason = 'import_failed';
        prismaRuntimeMessage =
          error instanceof Error ? error.message : 'Prisma client import/initialization failed.';
        return null;
      }
    })();
  }

  return prismaClientPromise;
}
