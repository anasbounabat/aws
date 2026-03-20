<script setup lang="ts">
definePageMeta({ middleware: ['require-admin'] })

const { $api } = useNuxtApp() as any
const stats = ref<{ users: number; teams: number; projects: number; tasks: number } | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await $api('/admin/stats')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h2 class="text-3xl font-bold mb-8 text-white">Tableau de bord Global</h2>

    <div v-if="loading" class="text-slate-300">Loading…</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <p class="text-slate-400 uppercase text-xs font-bold tracking-widest">Users</p>
        <p class="text-4xl font-black mt-2 text-indigo-400">{{ stats?.users ?? 0 }}</p>
      </div>
      <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <p class="text-slate-400 uppercase text-xs font-bold tracking-widest">Teams</p>
        <p class="text-4xl font-black mt-2 text-indigo-400">{{ stats?.teams ?? 0 }}</p>
      </div>
      <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <p class="text-slate-400 uppercase text-xs font-bold tracking-widest">Projects</p>
        <p class="text-4xl font-black mt-2 text-indigo-400">{{ stats?.projects ?? 0 }}</p>
      </div>
      <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <p class="text-slate-400 uppercase text-xs font-bold tracking-widest">Tasks</p>
        <p class="text-4xl font-black mt-2 text-indigo-400">{{ stats?.tasks ?? 0 }}</p>
      </div>
    </div>
  </div>
</template>
