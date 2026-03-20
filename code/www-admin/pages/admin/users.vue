<script setup lang="ts">
definePageMeta({ middleware: ['require-admin'] })

const { $api } = useNuxtApp() as any
const users = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    users.value = (await $api('/admin/users')).users || []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <header class="mb-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400/90">Admin</p>
      <h2 class="mt-1 text-3xl font-bold tracking-tight text-white">Utilisateurs</h2>
      <p class="mt-2 text-sm text-slate-400">Liste des comptes enregistrés.</p>
    </header>

    <div v-if="loading" class="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
      Chargement…
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-xl shadow-black/10">
      <table class="w-full text-sm">
        <thead class="bg-slate-800/80 text-slate-300">
          <tr>
            <th class="text-left px-4 py-3">ID / Sub</th>
            <th class="text-left px-4 py-3">Email</th>
            <th class="text-left px-4 py-3">Role</th>
            <th class="text-left px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-t border-slate-700/70">
            <td class="px-4 py-3 font-mono text-xs">{{ u.id }}</td>
            <td class="px-4 py-3">{{ u.email || '-' }}</td>
            <td class="px-4 py-3">{{ u.role }}</td>
            <td class="px-4 py-3 text-slate-400">{{ u.created_at || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
