import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const prismaBin = isWindows ? 'prisma.cmd' : 'prisma';
const schemaArgs = ['--schema', 'prisma/schema.prisma'];
const maxLockRetries = Number.parseInt(process.env.PRISMA_GENERATE_DIRECT_LOCK_RETRIES ?? '4', 10);
const retryBackoffMs = Number.parseInt(process.env.PRISMA_GENERATE_DIRECT_RETRY_BACKOFF_MS ?? '500', 10);
const lockWaitMs = Number.parseInt(process.env.PRISMA_GENERATE_DIRECT_LOCK_WAIT_MS ?? '2500', 10);
const lockPollMs = Number.parseInt(process.env.PRISMA_GENERATE_DIRECT_LOCK_POLL_MS ?? '125', 10);
const allowHealthyClientReuse = process.env.PRISMA_GENERATE_DIRECT_ALLOW_HEALTHY_CLIENT_REUSE !== '0';

function runPrisma(args) {
  return spawnSync(prismaBin, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: isWindows,
    encoding: 'utf8',
  });
}

function outputText(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function hasWindowsEngineLockFailure(output) {
  return output.includes('EPERM') && output.includes('query_engine-windows.dll.node');
}

function sleep(ms) {
  if (ms <= 0) {
    return;
  }
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Keep retry pacing deterministic in this short-lived script.
  }
}

function engineTargetPath() {
  return path.resolve(process.cwd(), 'generated/prisma-client/query_engine-windows.dll.node');
}

function hasExistingEngineArtifact() {
  return existsSync(engineTargetPath());
}

function hasHealthyGeneratedClientRuntime() {
  const generatedClientEntry = path.resolve(process.cwd(), 'generated/prisma-client/index.js');
  if (!existsSync(generatedClientEntry)) {
    return false;
  }

  const probeScript = `
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const entry = path.resolve(process.cwd(), 'generated/prisma-client/index.js');
  const prismaModule = await import(pathToFileURL(entry).href);
  if (!prismaModule.PrismaClient) {
    throw new Error('PrismaClient export missing.');
  }
  const client = new prismaModule.PrismaClient();
  try {
    await client.$queryRawUnsafe('SELECT 1');
  } finally {
    await client.$disconnect();
  }
})().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
  `.trim();

  const probe = spawnSync(process.execPath, ['-e', probeScript], {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    encoding: 'utf8',
  });

  return probe.status === 0;
}

function hasRenameLock(filepath) {
  if (!existsSync(filepath)) {
    return false;
  }
  const probePath = `${filepath}.rename-probe`;
  try {
    renameSync(filepath, probePath);
    renameSync(probePath, filepath);
    return false;
  } catch {
    try {
      if (existsSync(probePath)) {
        renameSync(probePath, filepath);
      }
    } catch {
      // Ignore; this is probe cleanup only.
    }
    return true;
  }
}

function waitForRenameUnlock(filepath, maxWait, pollMs) {
  if (!existsSync(filepath)) {
    return true;
  }
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (!hasRenameLock(filepath)) {
      return true;
    }
    sleep(pollMs);
  }
  return !hasRenameLock(filepath);
}

function cleanupEngineArtifacts() {
  const candidateDirs = [
    path.resolve(process.cwd(), 'generated/prisma-client'),
    path.resolve(process.cwd(), '../generated/prisma-client'),
    path.resolve(process.cwd(), 'node_modules/.prisma/client'),
    path.resolve(process.cwd(), '../../node_modules/.prisma/client'),
    path.resolve(process.cwd(), '../../../node_modules/.prisma/client'),
    path.resolve(process.cwd(), '../web/node_modules/.prisma/client'),
    path.resolve(process.cwd(), '../crm/node_modules/.prisma/client'),
  ];

  for (const directory of candidateDirs) {
    if (!existsSync(directory)) {
      continue;
    }

    for (const filename of [
      'query_engine-windows.dll.node',
      'query_engine-windows.exe',
      'libquery_engine-windows.dll.node',
    ]) {
      const candidate = path.resolve(directory, filename);
      if (existsSync(candidate)) {
        try {
          rmSync(candidate, { force: true });
        } catch {
          // Ignore and continue cleanup attempts.
        }
      }
    }

    try {
      const files = readdirSync(directory);
      for (const file of files) {
        if (file.startsWith('query_engine-windows.dll.node.tmp')) {
          const candidate = path.resolve(directory, file);
          try {
            rmSync(candidate, { force: true });
          } catch {
            // Ignore and continue cleanup attempts.
          }
        }
      }
    } catch {
      // Ignore and continue cleanup attempts.
    }
  }
}

function printResult(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

let result = runPrisma(['generate', ...schemaArgs]);
if (result.status === 0) {
  printResult(result);
  process.exit(0);
}

for (let retry = 1; retry <= maxLockRetries; retry += 1) {
  const output = outputText(result);
  if (!hasWindowsEngineLockFailure(output)) {
    printResult(result);
    process.exit(result.status ?? 1);
  }

  const targetPath = engineTargetPath();
  if (!waitForRenameUnlock(targetPath, lockWaitMs, lockPollMs)) {
    console.warn(
      `[db:generate:direct] Engine file remained rename-locked after ${lockWaitMs}ms wait window.`
    );
  }
  cleanupEngineArtifacts();
  const waitMs = retryBackoffMs * retry;
  console.warn(
    `[db:generate:direct] Retrying Prisma generate after lock mitigation (${retry}/${maxLockRetries}) with ${waitMs}ms backoff.`
  );
  sleep(waitMs);
  result = runPrisma(['generate', ...schemaArgs]);
  if (result.status === 0) {
    printResult(result);
    process.exit(0);
  }
}

printResult(result);
const finalOutput = outputText(result);
if (allowHealthyClientReuse && hasWindowsEngineLockFailure(finalOutput) && hasExistingEngineArtifact()) {
  if (hasHealthyGeneratedClientRuntime()) {
    console.warn(
      '[db:generate:direct] Lock persists, but existing generated client is healthy; reusing current full-engine client.'
    );
    process.exit(0);
  }
}

if (hasWindowsEngineLockFailure(finalOutput) && hasExistingEngineArtifact()) {
  console.warn(
    '[db:generate:direct] Lock persists and existing generated client health check failed; full-engine generation remains blocked.'
  );
}

process.exit(result.status ?? 1);
