import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const prismaBin = isWindows ? 'prisma.cmd' : 'prisma';
const schemaArgs = ['--schema', 'prisma/schema.prisma'];

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

const initial = runPrisma(['generate', ...schemaArgs]);
if (initial.status === 0) {
  printResult(initial);
  process.exit(0);
}

const initialOutput = outputText(initial);
if (!hasWindowsEngineLockFailure(initialOutput)) {
  printResult(initial);
  process.exit(initial.status ?? 1);
}

console.warn(
  '[db:generate] Detected Prisma Windows engine file lock. Retrying after engine artifact cleanup.'
);
cleanupEngineArtifacts();

const retry = runPrisma(['generate', ...schemaArgs]);
if (retry.status === 0) {
  printResult(retry);
  process.exit(0);
}

const retryOutput = outputText(retry);
if (!hasWindowsEngineLockFailure(retryOutput)) {
  printResult(retry);
  process.exit(retry.status ?? 1);
}

console.warn(
  '[db:generate] Lock persists. Falling back to --no-engine so type generation remains available.'
);
const fallback = runPrisma(['generate', '--no-engine', ...schemaArgs]);
printResult(fallback);
process.exit(fallback.status ?? 1);
