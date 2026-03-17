<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const { $api } = useNuxtApp()
const stats = ref<{ users: number; teams: number; projects: number; tasks: number } | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    stats.value = await $api('/admin/stats')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to load stats'
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b bg-white">
      <div class="mx-auto max-w-5xl p-4 flex items-center justify-between">
        <div>
          <NuxtLink to="/dashboard" class="text-sm text-slate-600 underline">Back</NuxtLink>
          <div class="text-lg font-semibold mt-1">Admin stats</div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl p-4">
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div v-if="!stats" class="text-slate-600">Loading…</div>

      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-2xl bg-white shadow p-4">
          <div class="text-sm text-slate-500">Users</div>
          <div class="text-3xl font-semibold mt-1">{{ stats.users }}</div>
        </div>
        <div class="rounded-2xl bg-white shadow p-4">
          <div class="text-sm text-slate-500">Teams</div>
          <div class="text-3xl font-semibold mt-1">{{ stats.teams }}</div>
        </div>
        <div class="rounded-2xl bg-white shadow p-4">
          <div class="text-sm text-slate-500">Projects</div>
          <div class="text-3xl font-semibold mt-1">{{ stats.projects }}</div>
        </div>
        <div class="rounded-2xl bg-white shadow p-4">
          <div class="text-sm text-slate-500">Tasks</div>
          <div class="text-3xl font-semibold mt-1">{{ stats.tasks }}</div>
        </div>
      </div>
    </main>
  </div>
</template>

