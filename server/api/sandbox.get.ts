export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env
  const sandbox = await hubSandbox({ namespace: env?.SANDBOX })

  const result = await sandbox.exec('echo', ['Hello from sandbox!'])
  await sandbox.writeFile('/tmp/test.txt', 'NuxtHub Sandbox works!')
  const content = await sandbox.readFile('/tmp/test.txt')
  await sandbox.stop()

  return { exec: result, fileContent: content }
})
