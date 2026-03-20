<script setup lang="ts">
const props = defineProps<{ activeTeamId?: string | null }>()

const { $api } = useNuxtApp() as any
const teams = ref<any[]>([])
const loading = ref(true)

async function refresh() {
  loading.value = true
  try {
    const res = await $api('/teams')
    teams.value = res.teams || []
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

// When the user creates/switches teams, refresh the list so the new team appears.
watch(
  () => props.activeTeamId,
  () => {
    refresh()
  }
)
</script>

<template>
  <aside class="w-[280px] shrink-0 app-surface app-border border-r hidden md:flex flex-col">
    <div class="h-14 px-4 flex items-center justify-between app-border border-b">
      <NuxtLink to="/dashboard" class="text-sm font-semibold text-slate-100 app-title">User Dashboard</NuxtLink>
    </div>

    <div class="p-3 overflow-auto">
      <div class="text-xs text-slate-400 px-2 mb-2">Navigation</div>
      <nav class="space-y-1 mb-4">
        <NuxtLink to="/profile" class="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5">👤 Mon Profil</NuxtLink>
        <NuxtLink to="/teams" class="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5">👥 Mes Equipes</NuxtLink>
        <NuxtLink to="/projects" class="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5">📁 Projets & Taches</NuxtLink>
        <NuxtLink to="/invitations" class="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5">✉️ Invitations</NuxtLink>
      </nav>

      <div class="text-xs text-slate-400 px-2 mb-2">Equipes</div>
      <div v-if="loading" class="text-sm text-slate-300 px-2 py-2">Chargement…</div>
      <ul v-else class="space-y-1">
        <li v-for="t in teams" :key="t.id">
          <NuxtLink
            :to="`/dashboard?team=${t.id}`"
            class="block rounded-xl px-3 py-2 text-sm transition"
            :class="String(t.id) === String(activeTeamId) ? 'bg-white/10 text-slate-100' : 'text-slate-300 hover:bg-white/5'"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="truncate">{{ t.name }}</span>
              <span class="text-[11px] text-slate-500 font-mono">#{{ t.id }}</span>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <div class="mt-4">
        <NuxtLink to="/teams">
          <AppButton variant="secondary" size="sm" class="w-full">+ Creer une equipe</AppButton>
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>

