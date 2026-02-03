import { hubSandbox } from 'hub:sandbox'

export default defineEventHandler(async () => {
  const start = Date.now()
  try {
    const sandbox = await hubSandbox()
    try {
      const stdoutChunks: string[] = []
      const stderrChunks: string[] = []

      const exec = await sandbox.exec(
        'sh',
        ['-c', 'echo "line 1"; echo "line 2"; echo "error" 1>&2; echo "line 3"'],
        {
          onStdout: (data) => { stdoutChunks.push(data) },
          onStderr: (data) => { stderrChunks.push(data) },
        },
      )

      return {
        ok: true,
        provider: sandbox.provider,
        streaming: {
          exec,
          stdoutChunks,
          stderrChunks,
        },
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
