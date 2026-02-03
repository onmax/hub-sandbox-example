export default defineEventHandler(async () => {
  const sandbox = hubSandbox()

  const result = await sandbox.exec('echo', ['Hello from sandbox!'])
  await sandbox.writeFile('/tmp/test.txt', 'NuxtHub Sandbox works!')
  const content = await sandbox.readFile('/tmp/test.txt')
  await sandbox.stop()

  return { exec: result, fileContent: content }
})
