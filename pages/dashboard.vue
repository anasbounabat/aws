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
  <div class="min-h-screen bg-slate-50">
    <header class="border-b bg-white">
      <div class="mx-auto max-w-6xl p-4 flex items-center justify-between">
        <div>
          <div class="text-lg font-semibold">Dashboard</div>
          <div class="text-sm text-slate-500">{{ auth.user?.email }}</div>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink v-if="auth.user?.role === 'admin'" to="/admin" class="text-sm underline">Admin</NuxtLink>
          <button class="text-sm rounded-xl border px-3 py-2" @click="auth.logout(); navigateTo('/login')">
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl p-4 space-y-6">
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <div v-if="loading" class="text-slate-600">Loading…</div>

      <template v-else>
        <section class="grid md:grid-cols-2 gap-4">
          <div class="rounded-2xl bg-white shadow p-4">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Teams</h2>
            </div>

            <div class="mt-3 flex gap-2">
              <input v-model="newTeamName" placeholder="New team name" class="flex-1 rounded-xl border px-3 py-2" />
              <button class="rounded-xl bg-slate-900 text-white px-3 py-2" @click="createTeam">Create</button>
            </div>

            <ul class="mt-4 space-y-2">
              <li v-for="t in data?.teams" :key="t.id" class="flex items-center justify-between rounded-xl border p-3">
                <div class="font-medium">{{ t.name }}</div>
                <div class="text-xs text-slate-500" v-if="t.owner_id === auth.user?.id">owner</div>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl bg-white shadow p-4">
            <h2 class="font-semibold">Create project</h2>
            <div class="mt-3 space-y-2">
              <select v-model.number="selectedTeamId" class="w-full rounded-xl border px-3 py-2">
                <option v-for="t in data?.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <div class="flex gap-2">
                <input
                  v-model="newProjectName"
                  placeholder="Project name"
                  class="flex-1 rounded-xl border px-3 py-2"
                />
                <button class="rounded-xl bg-slate-900 text-white px-3 py-2" @click="createProject">Create</button>
              </div>
            </div>

            <h2 class="font-semibold mt-6">Invite member</h2>
            <div class="mt-3 space-y-2">
              <select v-model.number="inviteTeamId" class="w-full rounded-xl border px-3 py-2">
                <option :value="null" disabled>Select a team</option>
                <option v-for="t in data?.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <div class="flex gap-2">
                <input v-model="inviteEmail" placeholder="user@email.com" class="flex-1 rounded-xl border px-3 py-2" />
                <button class="rounded-xl border px-3 py-2" @click="invite">Invite</button>
              </div>
              <p class="text-xs text-slate-500">Only the team owner can invite.</p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white shadow p-4">
          <h2 class="font-semibold">Projects</h2>
          <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NuxtLink
              v-for="p in data?.projects"
              :key="p.id"
              :to="`/projects/${p.id}`"
              class="rounded-2xl border p-4 hover:border-slate-400"
            >
              <div class="font-medium">{{ p.name }}</div>
              <div class="text-sm text-slate-500 mt-1">{{ p.team_name }}</div>
            </NuxtLink>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

