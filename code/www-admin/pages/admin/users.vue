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
    <h2 class="text-3xl font-bold mb-8 text-white">Utilisateurs</h2>

    <div v-if="loading" class="text-slate-300">Loading…</div>
    <div v-else class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-700/60 text-slate-200">
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
