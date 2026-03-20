<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

const route = useRoute()
const teamId = computed(() => String(route.params.teamId))
const { $api } = useNuxtApp() as any

const team = ref<any | null>(null)
const members = ref<any[]>([])
const projects = ref<any[]>([])

const loading = ref(true)
const error = ref<string | null>(null)

const inviteOpen = ref(false)
const inviteEmail = ref('')

const projectOpen = ref(false)
const projectName = ref('')
const projectDescription = ref('')

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const t = await $api(`/teams/${teamId.value}`)
    team.value = t.team
    const m = await $api(`/teams/${teamId.value}/members`)
    members.value = m.members || []
    const p = await $api(`/teams/${teamId.value}/projects`)
    projects.value = p.projects || []
  } catch (e: any) {
    error.value = e?.message || 'Failed to load team'
  } finally {
    loading.value = false
  }
}

async function invite() {
  if (!inviteEmail.value.trim()) return
  error.value = null
  try {
    await $api(`/teams/${teamId.value}/invitations`, {
      method: 'POST',
      body: { email: inviteEmail.value.trim() }
    })
    inviteEmail.value = ''
    inviteOpen.value = false
  } catch (e: any) {
    error.value = e?.message || 'Failed to invite'
  }
}

async function createProject() {
  if (!projectName.value.trim()) return
  error.value = null
  try {
    await $api(`/teams/${teamId.value}/projects`, {
      method: 'POST',
      body: { name: projectName.value.trim(), description: projectDescription.value.trim() || null }
    })
    projectName.value = ''
    projectDescription.value = ''
    projectOpen.value = false
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Failed to create project'
  }
}

onMounted(refresh)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="app-title text-3xl font-semibold tracking-tight">{{ team?.name || 'Team' }}</h1>
        <p class="text-xs text-slate-400 font-mono">Team #{{ teamId }}</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/teams"><AppButton variant="ghost">Back</AppButton></NuxtLink>
        <AppButton variant="ghost" @click="refresh">Actualiser</AppButton>
        <AppButton variant="secondary" @click="inviteOpen = true">Inviter</AppButton>
        <AppButton variant="primary" @click="projectOpen = true">New project</AppButton>
      </div>
    </header>

    <p v-if="error" class="text-sm text-red-200">{{ error }}</p>

    <div v-if="loading" class="text-slate-300">Chargement…</div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <AppCard>
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-300">Members</div>
          <div class="text-xs text-slate-400">{{ members.length }} total</div>
        </div>
        <ul class="mt-4 space-y-2 text-sm">
          <li
            v-for="m in members"
            :key="m.user_id || m.id"
            class="rounded-xl border border-white/10 bg-black/15 p-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="text-slate-50 font-medium truncate">{{ m.name || m.email || (m.user_id || m.id) }}</div>
              <div class="text-xs text-slate-400 font-mono truncate">{{ m.user_id || m.id }}</div>
            </div>
            <div class="text-xs rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200">
              {{ m.role || 'member' }}
            </div>
          </li>
        </ul>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-300">Projects</div>
          <div class="text-xs text-slate-400">{{ projects.length }} total</div>
        </div>

        <div v-if="!projects.length" class="mt-4 text-slate-200">
          Aucun projet. Creez-en un pour commencer a suivre les missions.
        </div>

        <ul v-else class="mt-4 grid gap-3">
          <li v-for="p in projects" :key="p.id" class="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-slate-50 font-semibold truncate">{{ p.name }}</div>
                <div v-if="p.description" class="text-sm text-slate-300 mt-1 line-clamp-2">{{ p.description }}</div>
                <div class="text-xs text-slate-400 font-mono mt-2">#{{ p.id }}</div>
              </div>
              <NuxtLink :to="`/projects/${p.id}`">
                <AppButton size="sm" variant="ghost">Ouvrir le board</AppButton>
              </NuxtLink>
            </div>
          </li>
        </ul>
      </AppCard>
    </div>

    <AppModal
      :open="inviteOpen"
      title="Inviter un membre"
      description="Send an invitation email to join this team."
      @close="inviteOpen = false"
    >
      <div class="space-y-4">
        <AppField label="Email">
          <AppInput v-model="inviteEmail" placeholder="email@example.com" type="email" autocomplete="email" />
        </AppField>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="inviteOpen = false">Annuler</AppButton>
          <AppButton variant="secondary" :disabled="!inviteEmail.trim()" @click="invite">Send invite</AppButton>
        </div>
      </div>
    </AppModal>

    <AppModal
      :open="projectOpen"
      title="Creer un projet"
      description="Projects hold tasks and boards (Kanban)."
      @close="projectOpen = false"
    >
      <div class="space-y-4">
        <AppField label="Name">
          <AppInput v-model="projectName" placeholder="e.g. Website redesign" />
        </AppField>
        <AppField label="Description" hint="optionnel">
          <AppTextarea v-model="projectDescription" placeholder="Short context for this project" :rows="4" />
        </AppField>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="projectOpen = false">Annuler</AppButton>
          <AppButton variant="primary" :disabled="!projectName.trim()" @click="createProject">Creer le projet</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

