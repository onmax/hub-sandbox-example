import { hubSandbox } from 'hub:sandbox'

export default defineEventHandler(async () => {
  const start = Date.now()
  try {
    const sandbox = await hubSandbox()
    try {
      const supports = sandbox.supports

      if (sandbox.provider === 'vercel') {
        const vercel = sandbox.vercel
        const metadata = vercel.getMetadata()
        let domain: string | null = null
        let domainError: string | undefined
        try {
          domain = vercel.domain(3000)
        }
        catch (error) {
          domainError = error instanceof Error ? error.message : String(error)
        }
        const hasNative = !!vercel.native

        return {
          ok: true,
          provider: sandbox.provider,
          supports,
          vercel: {
            metadata,
            domain,
            domainError,
            hasNative,
          },
          elapsedMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        }
      }

      if (sandbox.provider === 'cloudflare') {
        const filePath = '/tmp/feature-test.txt'
        await sandbox.writeFile(filePath, 'Cloudflare feature test')
        const content = await sandbox.readFile(filePath)

        const files = supports.listFiles ? await sandbox.listFiles('/tmp') : undefined
        const exists = supports.exists ? await sandbox.exists(filePath) : undefined

        return {
          ok: true,
          provider: sandbox.provider,
          supports,
          cloudflare: {
            content,
            files,
            exists,
          },
          elapsedMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        }
      }

      return {
        ok: false,
        provider: sandbox.provider,
        error: `Unsupported provider: ${sandbox.provider}`,
        elapsedMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      }
    }
    finally {
      await sandbox.stop()
    }
  }
  catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    }
  }
})
