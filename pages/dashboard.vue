<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const auth = useAuth()
const router = useRouter()

const data = ref<{ teams: any[]; projects: any[] } | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const newTeamName = ref('')
const newProjectName = ref('')
const selectedTeamId = ref<number | null>(null)
const inviteEmail = ref('')
const inviteTeamId = ref<number | null>(null)

async function refresh() {
  loading.value = true
  error.value = null
  try {
    data.value = await $api('/dashboard')
    if (!selectedTeamId.value && data.value.teams?.length) {
      selectedTeamId.value = data.value.teams[0].id
    }
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
}

async function createTeam() {
  if (!newTeamName.value.trim()) return
  await $api('/teams', { method: 'POST', body: { name: newTeamName.value.trim() } })
  newTeamName.value = ''
  await refresh()
}

async function createProject() {
  if (!selectedTeamId.value) return
  if (!newProjectName.value.trim()) return
  const res = await $api<{ project: { id: number } }>('/projects', {
    method: 'POST',
    body: { name: newProjectName.value.trim(), team_id: selectedTeamId.value }
  })
  newProjectName.value = ''
  await refresh()
  await router.push(`/projects/${res.project.id}`)
}

async function invite() {
  if (!inviteTeamId.value) return
  if (!inviteEmail.value.trim()) return
  await $api(`/teams/${inviteTeamId.value}/invite`, { method: 'POST', body: { email: inviteEmail.value.trim() } })
  inviteEmail.value = ''
  await refresh()
}

onMounted(async () => {
  if (auth.token.value && !auth.user.value) await auth.loadMe()
  await refresh()
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-end justify-between gap-4">
      <div>
        <h1 class="title text-3xl text-sand-50">Dashboard</h1>
        <p class="text-sm text-sand-100/70 mt-1">{{ auth.user?.email }}</p>
      </div>
      <button class="text-sm rounded-xl bg-sand-100/10 hover:bg-sand-100/15 text-sand-50 px-3 py-2 transition" @click="refresh">
        Refresh
      </button>
    </header>

    <p v-if="error" class="text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
      {{ error }}
    </p>
    <div v-if="loading" class="text-sand-100/70">Loading…</div>

      <template v-else>
        <section class="grid lg:grid-cols-2 gap-4">
          <div class="card p-5">
            <div class="flex items-center justify-between">
              <h2 class="title text-2xl">Teams</h2>
              <span class="pill">{{ data?.teams?.length || 0 }}</span>
            </div>

            <div class="mt-4 flex gap-2">
              <input v-model="newTeamName" placeholder="New team name" class="input flex-1" />
              <button class="btn-primary" @click="createTeam">Create</button>
            </div>

            <ul class="mt-4 space-y-2">
              <li
                v-for="t in data?.teams"
                :key="t.id"
                class="flex items-center justify-between rounded-2xl border border-ink-950/10 bg-sand-50 p-3"
              >
                <div class="font-medium">{{ t.name }}</div>
                <div class="text-xs text-ink-950/50" v-if="t.owner_id === auth.user?.id">owner</div>
              </li>
            </ul>
          </div>

          <div class="card p-5">
            <h2 class="title text-2xl">Create project</h2>
            <p class="muted text-sm mt-1">Pick a team, then create a board.</p>
            <div class="mt-4 space-y-2">
              <select v-model.number="selectedTeamId" class="select">
                <option v-for="t in data?.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <div class="flex gap-2">
                <input
                  v-model="newProjectName"
                  placeholder="Project name"
                  class="input flex-1"
                />
                <button class="btn-primary" @click="createProject">Create</button>
              </div>
            </div>

            <div class="divider my-6" />

            <h2 class="title text-2xl">Invite member</h2>
            <p class="muted text-sm mt-1">Add an existing user by email (owner only).</p>
            <div class="mt-4 space-y-2">
              <select v-model.number="inviteTeamId" class="select">
                <option :value="null" disabled>Select a team</option>
                <option v-for="t in data?.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <div class="flex gap-2">
                <input v-model="inviteEmail" placeholder="user@email.com" class="input flex-1" />
                <button class="btn-outline" @click="invite">Invite</button>
              </div>
              <p class="text-xs text-ink-950/50">Only the team owner can invite.</p>
            </div>
          </div>
        </section>

        <section class="card p-5">
          <div class="flex items-center justify-between">
            <h2 class="title text-2xl">Projects</h2>
            <span class="pill">{{ data?.projects?.length || 0 }}</span>
          </div>
          <div class="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NuxtLink
              v-for="p in data?.projects"
              :key="p.id"
              :to="`/projects/${p.id}`"
              class="rounded-2xl border border-ink-950/10 bg-sand-50 p-4 hover:border-ink-950/20 hover:shadow-soft transition"
            >
              <div class="font-medium">{{ p.name }}</div>
              <div class="text-sm text-ink-950/55 mt-1">{{ p.team_name }}</div>
            </NuxtLink>
          </div>
        </section>
      </template>
  </div>
</template>

