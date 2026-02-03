# NuxtHub Sandbox Example

Unified sandbox API for isolated code execution on Vercel and Cloudflare.

## Setup

```bash
pnpm install
```

## Deploy

**Vercel:**
```bash
pnpm deploy:vercel
```

**Cloudflare:**
```bash
# Docker must be running
pnpm deploy:cloudflare
```

## Usage

```ts
// server/api/sandbox.get.ts
export default defineEventHandler(async () => {
  const sandbox = hubSandbox()

  const result = await sandbox.exec('echo', ['hello'])
  await sandbox.writeFile('/tmp/test.txt', 'content')
  const content = await sandbox.readFile('/tmp/test.txt')
  await sandbox.stop()

  return { result, content }
})
```

## Response

```json
{
  "exec": { "ok": true, "stdout": "Hello from sandbox!", "stderr": "", "code": 0 },
  "fileContent": "NuxtHub Sandbox works!"
}
```

## Links

- [NuxtHub](https://hub.nuxt.com)
- [unagent](https://github.com/unjs/unagent)
