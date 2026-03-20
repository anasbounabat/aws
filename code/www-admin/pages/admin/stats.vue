<script setup lang="ts">
definePageMeta({ middleware: ['require-admin'] })

const { $api } = useNuxtApp() as any
const stats = ref<{ users: number; teams: number; projects: number; tasks: number } | null>(null)
const loading = ref(true)

const cards = computed(() => {
  const s = stats.value
  return [
    { key: 'users', label: 'Utilisateurs', value: s?.users ?? 0, icon: '👤', accent: 'from-violet-500/20 to-violet-600/5' },
    { key: 'teams', label: 'Équipes', value: s?.teams ?? 0, icon: '🏢', accent: 'from-fuchsia-500/20 to-fuchsia-600/5' },
    { key: 'projects', label: 'Projets', value: s?.projects ?? 0, icon: '📁', accent: 'from-cyan-500/15 to-cyan-600/5' },
    { key: 'tasks', label: 'Tâches', value: s?.tasks ?? 0, icon: '✓', accent: 'from-emerald-500/15 to-emerald-600/5' }
  ]
})

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
    <header class="mb-10">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400/90">Admin</p>
      <h2 class="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">Tableau de bord</h2>
      <p class="mt-2 max-w-xl text-sm text-slate-400">
        Vue d’ensemble des compteurs clés de la plateforme.
      </p>
    </header>

    <div v-if="loading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
      />
    </div>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="c in cards"
        :key="c.key"
        class="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl shadow-black/20 transition hover:border-slate-700/90"
      >
        <div
          :class="[
            'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition group-hover:opacity-80',
            c.accent
          ]"
          aria-hidden="true"
        />
        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ c.label }}</p>
            <p class="mt-3 text-4xl font-black tabular-nums text-white">{{ c.value }}</p>
          </div>
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-xl ring-1 ring-slate-700/50"
            aria-hidden="true"
          >
            {{ c.icon }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
