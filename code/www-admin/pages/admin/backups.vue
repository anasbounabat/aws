<script setup lang="ts">
definePageMeta({ middleware: ['require-admin'] })

const { $api } = useNuxtApp() as any
const backups = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    backups.value = (await $api('/admin/backups')).backups || []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <header class="mb-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400/90">Admin</p>
      <h2 class="mt-1 text-3xl font-bold tracking-tight text-white">Backups S3</h2>
      <p class="mt-2 text-sm text-slate-400">Historique des sauvegardes stockées sur S3.</p>
    </header>

    <div v-if="loading" class="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
      Chargement…
    </div>
    <div v-else class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-xl shadow-black/10">
      <div
        v-for="b in backups"
        :key="b.id"
        class="flex items-center justify-between gap-4 border-b border-slate-800/80 p-4 last:border-b-0"
      >
        <div class="min-w-0">
          <div class="text-slate-100 font-medium">Backup #{{ b.id }}</div>
          <div class="text-xs text-slate-400">{{ b.created_at }}</div>
          <div class="text-xs text-slate-500 font-mono truncate">{{ b.s3_url }}</div>
        </div>
        <a :href="b.s3_url" target="_blank" class="text-blue-400 text-sm hover:underline">Telecharger (S3)</a>
      </div>
    </div>
  </div>
</template>
