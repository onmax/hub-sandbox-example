import { hubSandbox } from 'hub:sandbox'

export default defineEventHandler(async () => {
  const start = Date.now()
  try {
    const sandbox = await hubSandbox()
    try {
      if (sandbox.provider === 'vercel' && sandbox.supports.startProcess) {
        const process = await sandbox.startProcess('sh', ['-c', 'for i in 1 2 3; do echo "tick $i"; sleep 0.5; done; sleep 5'])

        let logResult = { line: '' }
        try {
          logResult = await process.waitForLog(/tick 2/, 10_000)
        }
        catch {
          // fallback to log polling below
        }

        const logsAfterWait = await process.logs()
        if (!logResult.line && /tick 2/.test(logsAfterWait.stdout)) {
          logResult = { line: 'tick 2' }
        }

        await process.kill('SIGTERM')
        const waitResult = await process.wait(10_000)
        const finalLogs = await process.logs()

        return {
          ok: true,
          provider: sandbox.provider,
          process: {
            mode: 'startProcess',
            id: process.id,
            command: process.command,
            logResult,
            logsAfterWait,
            waitResult,
            finalLogs,
          },
          elapsedMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        }
      }

      const stdoutChunks: string[] = []
      const stderrChunks: string[] = []
      const execResult = await sandbox.exec('sh', ['-c', 'for i in 1 2 3; do echo "tick $i"; sleep 0.5; done'], {
        onStdout: data => stdoutChunks.push(data),
        onStderr: data => stderrChunks.push(data),
      })

      const stdout = stdoutChunks.join('') || execResult.stdout
      const stderr = stderrChunks.join('') || execResult.stderr

      return {
        ok: true,
        provider: sandbox.provider,
        process: {
          mode: 'exec-fallback',
          command: 'sh -c for i in 1 2 3; do echo "tick $i"; sleep 0.5; done',
          logResult: { foundTick2: /tick 2/.test(stdout), line: 'tick 2' },
          logs: { stdout, stderr },
          execResult,
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
