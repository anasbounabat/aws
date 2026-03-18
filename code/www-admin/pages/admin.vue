<script setup lang="ts">
const auth = useAuth()
const { $api } = useNuxtApp() as any

const stats = ref<any>(null)
const users = ref<any[]>([])
const backups = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  await auth.loadMe()
  loading.value = true
  try {
    stats.value = await $api('/admin/stats')
    users.value = (await $api('/admin/users')).users || []
    backups.value = (await $api('/admin/backups')).backups || []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Admin</h1>
    <p class="text-sm text-slate-300 mt-1" v-if="auth.me">{{ auth.me.email }} · {{ auth.me.role }}</p>

    <div v-if="loading" class="mt-6 text-slate-300">Loading…</div>

    <div v-else class="mt-6 space-y-6">
      <section class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="text-sm text-slate-300">Stats</div>
        <pre class="mt-2 text-xs text-slate-200 overflow-auto">{{ stats }}</pre>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="text-sm text-slate-300">Users</div>
        <ul class="mt-2 space-y-1 text-sm text-slate-200">
          <li v-for="u in users" :key="u.id">
            {{ u.email || u.sub || u.id }} — {{ u.role }}
          </li>
        </ul>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="text-sm text-slate-300">Backups</div>
        <ul class="mt-2 space-y-1 text-sm text-slate-200">
          <li v-for="b in backups" :key="b.id">
            {{ b.created_at }} — {{ b.s3_url }}
          </li>
        </ul>
      </section>

      <button class="rounded-xl bg-white/10 hover:bg-white/15 text-slate-50 px-3 py-2 text-sm" @click="auth.logout()">
        Logout
      </button>
    </div>
  </div>
</template>

