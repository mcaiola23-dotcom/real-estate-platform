import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isWindows = process.platform === 'win32';
const nodeBin = process.execPath;
const directScriptPath = path.resolve(__dirname, 'db-generate-direct.mjs');

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function runGenerate() {
  return spawnSync(nodeBin, [directScriptPath], {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    encoding: 'utf8',
  });
}

function sleep(ms) {
  if (ms <= 0) {
    return;
  }
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy wait is acceptable here because this is a short-lived operational script.
  }
}

function getErrorText(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`.trim();
}

function hasWindowsEngineLockFailure(output) {
  return output.includes('EPERM') && output.includes('query_engine-windows.dll.node');
}

const attempts = parseInteger(process.argv[2] ?? process.env.PRISMA_RELIABILITY_ATTEMPTS, 10);
const delayMs = parseInteger(process.argv[3] ?? process.env.PRISMA_RELIABILITY_DELAY_MS, 0);
const cliFlags = new Set(process.argv.slice(2));
const jsonMode = process.env.PRISMA_RELIABILITY_OUTPUT_JSON === '1' || cliFlags.has('--json');
const exitZero = process.env.PRISMA_RELIABILITY_EXIT_ZERO === '1' || cliFlags.has('--exit-zero');

if (!isWindows) {
  console.warn(
    '[db:generate:sample] Non-Windows runtime detected. Results may be non-authoritative for Windows lock reliability.'
  );
}

let passed = 0;
let failed = 0;
let epermLockFailures = 0;
const failureSamples = [];

for (let i = 1; i <= attempts; i += 1) {
  const result = runGenerate();
  const ok = result.status === 0;
  const output = getErrorText(result);
  const epermLock = !ok && hasWindowsEngineLockFailure(output);

  if (ok) {
    passed += 1;
    console.log(`[db:generate:sample] attempt ${i}/${attempts}: PASS`);
  } else {
    failed += 1;
    if (epermLock) {
      epermLockFailures += 1;
    }
    console.log(
      `[db:generate:sample] attempt ${i}/${attempts}: FAIL${epermLock ? ' (EPERM lock)' : ''}`
    );
    if (failureSamples.length < 3) {
      failureSamples.push({
        attempt: i,
        status: result.status ?? 1,
        epermLock,
        output: output.slice(0, 600),
      });
    }
  }

  sleep(delayMs);
}

const summary = {
  attempts,
  passed,
  failed,
  passRate: Number(((passed / attempts) * 100).toFixed(2)),
  failureRate: Number(((failed / attempts) * 100).toFixed(2)),
  epermLockFailures,
  environment: {
    platform: process.platform,
    authoritativeForWindows: isWindows,
  },
  failureSamples,
};

if (jsonMode) {
  console.log(JSON.stringify({ type: 'db.generate.sample.summary', ...summary }, null, 2));
} else {
  console.log('[db:generate:sample] summary');
  console.log(`  attempts=${summary.attempts}`);
  console.log(`  passed=${summary.passed}`);
  console.log(`  failed=${summary.failed}`);
  console.log(`  passRate=${summary.passRate}%`);
  console.log(`  failureRate=${summary.failureRate}%`);
  console.log(`  epermLockFailures=${summary.epermLockFailures}`);
  if (summary.failureSamples.length > 0) {
    console.log('  failureSamples:');
    for (const sample of summary.failureSamples) {
      const compactOutput = sample.output.replace(/\s+/g, ' ').trim();
      console.log(
        `    attempt=${sample.attempt} status=${sample.status} epermLock=${sample.epermLock} output="${compactOutput.slice(0, 220)}"`
      );
    }
  }
}

if (!exitZero && failed > 0) {
  process.exit(1);
}
