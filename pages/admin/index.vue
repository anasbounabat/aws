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
  <div>
    <header class="flex items-end justify-between gap-4">
      <div>
        <NuxtLink to="/dashboard" class="text-sm text-sand-100/70 hover:text-sand-50 underline underline-offset-4">
          Back
        </NuxtLink>
        <h1 class="title text-3xl text-sand-50 mt-2">Admin stats</h1>
        <p class="text-sm text-sand-100/70 mt-1">High-level activity across the workspace.</p>
      </div>
    </header>

    <div class="mt-6">
      <p v-if="error" class="text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
        {{ error }}
      </p>

      <div v-if="!stats" class="text-sand-100/70">Loading…</div>

      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-5">
          <div class="muted text-sm">Users</div>
          <div class="title text-4xl mt-2">{{ stats.users }}</div>
        </div>
        <div class="card p-5">
          <div class="muted text-sm">Teams</div>
          <div class="title text-4xl mt-2">{{ stats.teams }}</div>
        </div>
        <div class="card p-5">
          <div class="muted text-sm">Projects</div>
          <div class="title text-4xl mt-2">{{ stats.projects }}</div>
        </div>
        <div class="card p-5">
          <div class="muted text-sm">Tasks</div>
          <div class="title text-4xl mt-2">{{ stats.tasks }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

