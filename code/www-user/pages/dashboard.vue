<script setup lang="ts">
const auth = useAuth()
const { $api } = useNuxtApp() as any

const teams = ref<any[]>([])
const invitations = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  await auth.loadMe()
  loading.value = true
  try {
    const t = await $api('/teams')
    teams.value = t.teams || []
    const inv = await $api('/invitations')
    invitations.value = inv.invitations || []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p class="text-sm text-slate-300 mt-1" v-if="auth.me">
      {{ auth.me.name || auth.me.email }} · <span class="font-mono">{{ auth.me.role }}</span>
    </p>

    <div v-if="loading" class="mt-6 text-slate-300">Loading…</div>

    <div v-else class="mt-6 space-y-6">
      <section class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="text-sm text-slate-300">Invitations</div>
        <div v-if="!invitations.length" class="text-slate-200 mt-2">Aucune invitation.</div>
        <ul v-else class="mt-2 space-y-2">
          <li v-for="i in invitations" :key="i.id" class="flex items-center justify-between">
            <div class="text-slate-200">Invitation #{{ i.id }} (team {{ i.team_id }})</div>
            <div class="flex gap-2">
              <NuxtLink :to="`/invitations/${i.id}/accept`" class="text-sm underline">Accepter</NuxtLink>
              <NuxtLink :to="`/invitations/${i.id}/reject`" class="text-sm underline">Refuser</NuxtLink>
            </div>
          </li>
        </ul>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="text-sm text-slate-300">Mes équipes</div>
        <div v-if="!teams.length" class="text-slate-200 mt-2">Aucune équipe.</div>
        <ul v-else class="mt-2 space-y-2">
          <li v-for="t in teams" :key="t.id" class="text-slate-200">
            {{ t.name }} (#{{ t.id }})
          </li>
        </ul>
      </section>

      <button class="rounded-xl bg-white/10 hover:bg-white/15 text-slate-50 px-3 py-2 text-sm" @click="auth.logout()">
        Logout
      </button>
    </div>
  </div>
</template>

