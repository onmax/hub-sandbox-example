import { detectSandbox, isSandboxAvailable } from 'hub:sandbox'

type ResolvedEnvConfig = {
  provider?: 'vercel' | 'cloudflare'
  runtime?: string
  timeout?: number
  cpu?: number
  ports?: number[]
  sandboxId?: string
  cloudflare?: {
    sleepAfter?: string | number
    keepAlive?: boolean
    normalizeId?: boolean
  }
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value)
    return undefined
  if (value === 'true' || value === '1')
    return true
  if (value === 'false' || value === '0')
    return false
  return undefined
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value)
    return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

function parsePorts(value: string | undefined): number[] | undefined {
  if (!value)
    return undefined
  const ports = value.split(',').map(p => Number(p.trim())).filter(p => Number.isFinite(p))
  return ports.length ? ports : undefined
}

function parseEnvConfig(): ResolvedEnvConfig {
  const providerRaw = process.env.NUXT_HUB_SANDBOX_PROVIDER?.toLowerCase()
  const provider = providerRaw === 'vercel' || providerRaw === 'cloudflare' ? providerRaw : undefined
  const runtime = process.env.NUXT_HUB_SANDBOX_RUNTIME
  const timeout = parseNumber(process.env.NUXT_HUB_SANDBOX_TIMEOUT)
  const cpu = parseNumber(process.env.NUXT_HUB_SANDBOX_CPU)
  const ports = parsePorts(process.env.NUXT_HUB_SANDBOX_PORTS)
  const sandboxId = process.env.NUXT_HUB_SANDBOX_ID

  const sleepAfter = process.env.NUXT_HUB_SANDBOX_CF_SLEEP_AFTER
  const keepAlive = parseBoolean(process.env.NUXT_HUB_SANDBOX_CF_KEEP_ALIVE)
  const normalizeId = parseBoolean(process.env.NUXT_HUB_SANDBOX_CF_NORMALIZE_ID)
  const cloudflare = sleepAfter || keepAlive !== undefined || normalizeId !== undefined
    ? {
        sleepAfter: sleepAfter ? (Number.isFinite(Number(sleepAfter)) ? Number(sleepAfter) : sleepAfter) : undefined,
        keepAlive,
        normalizeId,
      }
    : undefined

  return { provider, runtime, timeout, cpu, ports, sandboxId, cloudflare }
}

function resolveProvider(
  envConfig: ResolvedEnvConfig,
  detection: ReturnType<typeof detectSandbox>,
  eventProvider?: 'vercel' | 'cloudflare',
): 'vercel' | 'cloudflare' {
  if (envConfig.provider)
    return envConfig.provider
  if (eventProvider)
    return eventProvider
  if (detection.type === 'cloudflare')
    return 'cloudflare'
  if (detection.type === 'vercel')
    return 'vercel'
  return 'vercel'
}

export default defineEventHandler(async (event) => {
  const detection = detectSandbox()
  const envConfig = parseEnvConfig()
  const eventProvider = event.context.cloudflare?.env?.SANDBOX ? 'cloudflare' : undefined
  const resolvedProvider = resolveProvider(envConfig, detection, eventProvider)

  return {
    ok: true,
    provider: resolvedProvider,
    detection,
    available: {
      vercel: isSandboxAvailable('vercel'),
      cloudflare: isSandboxAvailable('cloudflare'),
    },
    resolved: {
      provider: resolvedProvider,
      runtime: envConfig.runtime,
      timeout: envConfig.timeout,
      cpu: envConfig.cpu,
      ports: envConfig.ports,
      sandboxId: envConfig.sandboxId,
      cloudflare: envConfig.cloudflare,
    },
    timestamp: new Date().toISOString(),
  }
})
