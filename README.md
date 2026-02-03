# NuxtHub Sandbox Example (Nuxt 4)

Unified sandbox API for isolated code execution on Vercel and Cloudflare.

## Requirements

- Node.js + pnpm
- Vercel CLI (`vercel login`)
- Wrangler CLI (`wrangler login`)
- Docker (required for Cloudflare Sandbox container build)

## Setup

```bash
pnpm install
```

## Configuration

`nuxt.config.ts` enables zero-config sandboxing:

```ts
export default defineNuxtConfig({
  modules: ['@nuxthub/core', '@nuxt/ui'],
  hub: { sandbox: true },
  compatibilityDate: '2024-09-19',
})
```

### Environment Overrides (Highest Priority)

`hubSandbox(options)` > `NUXT_HUB_SANDBOX_*` > `hub.sandbox` > auto-detect

| Env Var | Description |
| --- | --- |
| `NUXT_HUB_SANDBOX_PROVIDER` | `vercel` or `cloudflare` |
| `NUXT_HUB_SANDBOX_RUNTIME` | Vercel runtime (e.g. `node24`) |
| `NUXT_HUB_SANDBOX_TIMEOUT` | Timeout ms |
| `NUXT_HUB_SANDBOX_CPU` | vCPU count |
| `NUXT_HUB_SANDBOX_PORTS` | Comma-separated ports |
| `NUXT_HUB_SANDBOX_ID` | Cloudflare sandbox ID |
| `NUXT_HUB_SANDBOX_CF_SLEEP_AFTER` | Cloudflare sleepAfter |
| `NUXT_HUB_SANDBOX_CF_KEEP_ALIVE` | `true` / `false` |
| `NUXT_HUB_SANDBOX_CF_NORMALIZE_ID` | `true` / `false` |

## API Endpoints

- `GET /api/health` — provider detection, availability, resolved config
- `GET /api/sandbox` — basic exec + file operations
- `GET /api/sandbox/features` — provider-specific checks
- `GET /api/sandbox/stream` — streaming stdout/stderr
- `GET /api/sandbox/process` — background process + log wait

## Deploy (Production)

### Vercel

```bash
vercel link
pnpm build:vercel
pnpm deploy:vercel:prod
```

If sandbox requests fail, ensure OIDC is enabled and tokens are pulled:

```bash
vercel env pull
```

### Cloudflare

```bash
# Docker must be running
pnpm build:cloudflare
pnpm deploy:cloudflare:prod
```

This repository is pinned to Cloudflare account:
`ba6e044dfdaaffec3cac45e9feccd237`

## Smoke Tests

```bash
BASE_URL=https://your-deploy.vercel.app pnpm smoke
BASE_URL=https://your-worker.your-account.workers.dev pnpm smoke
```

## Usage Example

```ts
import { hubSandbox } from 'hub:sandbox'

export default defineEventHandler(async () => {
  const sandbox = await hubSandbox()
  try {
    const exec = await sandbox.exec('echo', ['hello'])
    await sandbox.writeFile('/tmp/test.txt', 'content')
    const content = await sandbox.readFile('/tmp/test.txt')
    return { exec, content }
  }
  finally {
    await sandbox.stop()
  }
})
```

## Reference

Playground UX and feature coverage mirror the local reference at:
`~/unjs/unagent`

## Links

- [Live (Vercel)](https://hub-sandbox-example-nuxt4.vercel.app)
- [Live (Cloudflare)](https://onmax-hub-sandbox-example.maximogarciamtnez.workers.dev)
- [NuxtHub](https://hub.nuxt.com)
- [unagent](https://github.com/unjs/unagent)
