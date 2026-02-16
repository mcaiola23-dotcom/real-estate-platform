import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const prismaBin = isWindows ? 'prisma.cmd' : 'prisma';
const schemaArgs = ['--schema', 'prisma/schema.prisma'];
const maxLockRetries = Number.parseInt(process.env.PRISMA_GENERATE_LOCK_RETRIES ?? '3', 10);
const retryBackoffMs = Number.parseInt(process.env.PRISMA_GENERATE_RETRY_BACKOFF_MS ?? '350', 10);
const allowNoEngineFallback = process.env.PRISMA_GENERATE_ALLOW_NO_ENGINE_FALLBACK !== '0';

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

let lastResult = runPrisma(['generate', ...schemaArgs]);
if (lastResult.status === 0) {
  printResult(lastResult);
  process.exit(0);
}

for (let retry = 1; retry <= maxLockRetries; retry += 1) {
  const previousOutput = outputText(lastResult);
  if (!hasWindowsEngineLockFailure(previousOutput)) {
    printResult(lastResult);
    process.exit(lastResult.status ?? 1);
  }

  const waitMs = retryBackoffMs * retry;
  console.warn(
    `[db:generate] Detected Prisma Windows engine file lock. Retrying (${retry}/${maxLockRetries}) after cleanup and ${waitMs}ms backoff.`
  );
  cleanupEngineArtifacts();
  sleep(waitMs);
  lastResult = runPrisma(['generate', ...schemaArgs]);
  if (lastResult.status === 0) {
    printResult(lastResult);
    process.exit(0);
  }
}

const finalOutput = outputText(lastResult);
if (!hasWindowsEngineLockFailure(finalOutput)) {
  printResult(lastResult);
  process.exit(lastResult.status ?? 1);
}

if (!allowNoEngineFallback) {
  printResult(lastResult);
  process.exit(lastResult.status ?? 1);
}

console.warn(
  '[db:generate] Lock persists after retries. Falling back to --no-engine so type generation remains available.'
);
const fallback = runPrisma(['generate', '--no-engine', ...schemaArgs]);
printResult(fallback);
process.exit(fallback.status ?? 1);
