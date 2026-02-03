<script setup lang="ts">
import { onMounted, ref } from 'vue'

type LogEntry = {
  time: string
  endpoint: string
  status: 'success' | 'error' | 'loading'
  elapsedMs?: number
  payload?: unknown
  error?: string
}

const status = ref<null | {
  ok?: boolean
  provider?: string
  detection?: unknown
  available?: unknown
  resolved?: unknown
  timestamp?: string
}>(null)

const logs = ref<LogEntry[]>([])
const loading = ref<Record<string, boolean>>({})

const coreEndpoints = [
  { label: 'health', path: '/api/health' },
  { label: 'sandbox', path: '/api/sandbox' },
  { label: 'features', path: '/api/sandbox/features' },
]

const advancedEndpoints = [
  { label: 'stream', path: '/api/sandbox/stream' },
  { label: 'process', path: '/api/sandbox/process' },
]

function format(value: unknown) {
  try {
    return JSON.stringify(value ?? null, null, 2)
  }
  catch {
    return String(value ?? '')
  }
}

async function callEndpoint(path: string) {
  const time = new Date().toLocaleTimeString()
  const entry: LogEntry = { time, endpoint: path, status: 'loading' }
  logs.value = [entry, ...logs.value]
  loading.value[path] = true

  const start = Date.now()
  try {
    const res = await fetch(path)
    const payload = await res.json()
    const elapsedMs = Date.now() - start
    entry.status = res.ok ? 'success' : 'error'
    entry.elapsedMs = elapsedMs
    entry.payload = payload
    if (!res.ok) {
      entry.error = payload?.error || res.statusText
    }
  }
  catch (err) {
    entry.status = 'error'
    entry.error = err instanceof Error ? err.message : String(err)
  }
  finally {
    loading.value[path] = false
  }
}

function clearLogs() {
  logs.value = []
}

onMounted(async () => {
  try {
    const res = await fetch('/api/health')
    status.value = await res.json()
  }
  catch (err) {
    status.value = { ok: false, provider: 'unknown', timestamp: new Date().toISOString() }
    logs.value = [{
      time: new Date().toLocaleTimeString(),
      endpoint: '/api/health',
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    }, ...logs.value]
  }
})
</script>

<template>
  <UApp>
    <UContainer class="py-10 space-y-10">
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-semibold">NuxtHub Sandbox</h1>
          <UBadge color="gray">Nuxt 4 + unagent 0.0.5</UBadge>
        </div>
        <p class="text-base text-gray-500">
          Unified sandbox API for Vercel and Cloudflare. Use the buttons below to run the examples and inspect logs.
        </p>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="font-medium">Status</div>
            <UBadge :color="status?.ok ? 'green' : 'red'">
              {{ status?.ok ? 'healthy' : 'unknown' }}
            </UBadge>
          </div>
        </template>
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <div class="text-xs uppercase text-gray-400">Provider</div>
            <div class="text-sm font-medium">{{ status?.provider ?? 'n/a' }}</div>
          </div>
          <div>
            <div class="text-xs uppercase text-gray-400">Timestamp</div>
            <div class="text-sm font-medium">{{ status?.timestamp ?? 'n/a' }}</div>
          </div>
          <div class="md:col-span-2">
            <div class="text-xs uppercase text-gray-400">Available</div>
            <pre class="text-xs bg-gray-950 text-gray-100 rounded-md p-3 overflow-x-auto">{{ format(status?.available) }}</pre>
          </div>
          <div class="md:col-span-2">
            <div class="text-xs uppercase text-gray-400">Resolved</div>
            <pre class="text-xs bg-gray-950 text-gray-100 rounded-md p-3 overflow-x-auto">{{ format(status?.resolved) }}</pre>
          </div>
          <div class="md:col-span-2">
            <div class="text-xs uppercase text-gray-400">Detection</div>
            <pre class="text-xs bg-gray-950 text-gray-100 rounded-md p-3 overflow-x-auto">{{ format(status?.detection) }}</pre>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="font-medium">API Examples</div>
        </template>
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="text-xs uppercase text-gray-400">Core</div>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="endpoint in coreEndpoints"
                :key="endpoint.path"
                :loading="!!loading[endpoint.path]"
                @click="callEndpoint(endpoint.path)"
              >
                {{ endpoint.label }}
              </UButton>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-xs uppercase text-gray-400">Advanced</div>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="endpoint in advancedEndpoints"
                :key="endpoint.path"
                variant="soft"
                :loading="!!loading[endpoint.path]"
                @click="callEndpoint(endpoint.path)"
              >
                {{ endpoint.label }}
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="font-medium">Logs</div>
            <UButton color="gray" variant="ghost" @click="clearLogs">Clear</UButton>
          </div>
        </template>
        <div class="space-y-3">
          <div v-if="logs.length === 0" class="text-sm text-gray-500">No logs yet.</div>
          <div v-for="(log, idx) in logs" :key="idx" class="rounded-md border border-gray-200 p-3">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ log.time }}</span>
              <span>{{ log.endpoint }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <UBadge :color="log.status === 'success' ? 'green' : log.status === 'error' ? 'red' : 'gray'">
                {{ log.status }}
              </UBadge>
              <span v-if="log.elapsedMs" class="text-xs text-gray-500">{{ log.elapsedMs }}ms</span>
            </div>
            <div v-if="log.error" class="mt-2 text-xs text-red-600">{{ log.error }}</div>
            <pre v-if="log.payload" class="mt-2 text-xs bg-gray-950 text-gray-100 rounded-md p-3 overflow-x-auto">{{ format(log.payload) }}</pre>
          </div>
        </div>
      </UCard>
    </UContainer>
  </UApp>
</template>
