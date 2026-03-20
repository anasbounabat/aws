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
    <h2 class="text-3xl font-bold mb-8 text-white">Backups S3</h2>

    <div v-if="loading" class="text-slate-300">Loading…</div>
    <div v-else class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div
        v-for="b in backups"
        :key="b.id"
        class="p-4 border-b border-slate-700 last:border-b-0 flex items-center justify-between gap-4"
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
