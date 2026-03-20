<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

const { $api } = useNuxtApp() as any
const toast = useToast()

const loading = ref(true)
const teams = ref<any[]>([])
const selectedTeamId = ref<string | null>(null)
const projects = ref<any[]>([])
const createOpen = ref(false)
const name = ref('')
const description = ref('')
const creating = ref(false)

async function refreshTeams() {
  const res = await $api('/teams')
  teams.value = res.teams || []
  if (!selectedTeamId.value && teams.value[0]) {
    selectedTeamId.value = String(teams.value[0].id)
  }
}

async function refreshProjects() {
  if (!selectedTeamId.value) {
    projects.value = []
    return
  }
  const res = await $api(`/teams/${selectedTeamId.value}/projects`)
  projects.value = res.projects || []
}

async function createProject() {
  if (!selectedTeamId.value || !name.value.trim()) return
  creating.value = true
  try {
    await $api(`/teams/${selectedTeamId.value}/projects`, {
      method: 'POST',
      body: { name: name.value.trim(), description: description.value.trim() || null }
    })
    toast.push({ kind: 'success', title: 'Projet cree' })
    name.value = ''
    description.value = ''
    createOpen.value = false
    await refreshProjects()
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Echec', message: e?.message || 'Veuillez reessayer' })
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await refreshTeams()
    await refreshProjects()
  } finally {
    loading.value = false
  }
})

watch(selectedTeamId, refreshProjects)
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Projets & Taches</h1>
        <p class="text-sm text-slate-400">Vue par equipe pour creer et ouvrir un projet.</p>
      </div>
      <AppButton variant="primary" :disabled="!selectedTeamId" @click="createOpen = true">+ Creer un projet</AppButton>
    </header>

    <div class="rounded-2xl app-border border app-surface p-4 flex items-center gap-3">
      <div class="text-sm text-slate-300">Equipe</div>
      <select
        v-model="selectedTeamId"
        class="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-50 outline-none"
      >
        <option v-for="t in teams" :key="t.id" :value="String(t.id)">{{ t.name }}</option>
      </select>
    </div>

    <div v-if="loading" class="text-slate-300">Chargement…</div>
    <div v-else-if="!projects.length" class="rounded-2xl app-border border app-surface p-6 text-slate-300">
      Aucun projet. Cree un projet pour commencer.
    </div>
    <ul v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="p in projects" :key="p.id" class="rounded-2xl app-border border app-surface p-4">
        <div class="text-slate-100 font-medium">{{ p.name }}</div>
        <div class="text-xs text-slate-400 mt-1 line-clamp-2">{{ p.description || 'Sans description' }}</div>
        <div class="mt-4">
          <NuxtLink :to="`/projects/${p.id}`">
            <AppButton size="sm" variant="secondary">Ouvrir le board</AppButton>
          </NuxtLink>
        </div>
      </li>
    </ul>

    <AppModal :open="createOpen" title="Creer un projet" description="Nom + description du projet." @close="createOpen = false">
      <div class="space-y-4">
        <AppField label="Nom">
          <AppInput v-model="name" placeholder="Ex: Lancement mobile" />
        </AppField>
        <AppField label="Description / mission" hint="optionnel">
          <AppTextarea v-model="description" :rows="4" placeholder="Objectif du projet" />
        </AppField>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="createOpen = false">Annuler</AppButton>
          <AppButton variant="primary" :disabled="creating || !name.trim()" @click="createProject">
            {{ creating ? 'Creation…' : 'Creer' }}
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
