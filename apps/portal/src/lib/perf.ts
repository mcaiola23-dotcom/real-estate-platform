const DEV_PERF_ENABLED = process.env.NODE_ENV === 'development'
const PERF_SUMMARY_WINDOW_SIZE = 40
const PERF_SUMMARY_EVERY_N_SAMPLES = 5

const rollingDurations = new Map<string, number[]>()
const totalSampleCounts = new Map<string, number>()

export function perfNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

export function logPerf(event: string, data: Record<string, unknown> = {}) {
  if (!DEV_PERF_ENABLED) return
  console.log(`[Perf] ${event}`, data)
}

export function perfDurationMs(startMs: number): number {
  return Math.round((perfNow() - startMs) * 10) / 10
}

function roundMs(value: number): number {
  return Math.round(value * 10) / 10
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) return 0
  if (sortedValues.length === 1) return sortedValues[0]

  const index = (sortedValues.length - 1) * percentileValue
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)
  const lowerValue = sortedValues[lowerIndex]
  const upperValue = sortedValues[upperIndex]

  if (lowerIndex === upperIndex) return lowerValue

  const weight = index - lowerIndex
  return lowerValue + (upperValue - lowerValue) * weight
}

function updateRollingWindow(summaryKey: string, durationMs: number): { values: number[]; totalSamples: number } {
  const existingValues = rollingDurations.get(summaryKey) ?? []
  const nextValues = [...existingValues, durationMs]

  if (nextValues.length > PERF_SUMMARY_WINDOW_SIZE) {
    nextValues.shift()
  }

  rollingDurations.set(summaryKey, nextValues)

  const totalSamples = (totalSampleCounts.get(summaryKey) ?? 0) + 1
  totalSampleCounts.set(summaryKey, totalSamples)

  return {
    values: nextValues,
    totalSamples,
  }
}

function buildDurationSummary(values: number[]) {
  if (values.length === 0) {
    return {
      windowSize: 0,
      p50Ms: 0,
      p95Ms: 0,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
    }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((acc, value) => acc + value, 0)

  return {
    windowSize: values.length,
    p50Ms: roundMs(percentile(sorted, 0.5)),
    p95Ms: roundMs(percentile(sorted, 0.95)),
    avgMs: roundMs(sum / values.length),
    minMs: roundMs(sorted[0]),
    maxMs: roundMs(sorted[sorted.length - 1]),
  }
}

export function logPerfDuration(
  event: string,
  durationMs: number,
  data: Record<string, unknown> = {},
  summaryKey: string = event
) {
  if (!DEV_PERF_ENABLED) return

  const numericDuration = Number(durationMs)
  if (!Number.isFinite(numericDuration) || numericDuration < 0) return

  logPerf(event, {
    durationMs: roundMs(numericDuration),
    ...data,
  })

  const { values, totalSamples } = updateRollingWindow(summaryKey, numericDuration)
  if (totalSamples % PERF_SUMMARY_EVERY_N_SAMPLES !== 0) return

  logPerf(`${event}.summary`, {
    ...buildDurationSummary(values),
    totalSamples,
    summaryWindowSize: PERF_SUMMARY_WINDOW_SIZE,
    summaryEvery: PERF_SUMMARY_EVERY_N_SAMPLES,
  })
}
