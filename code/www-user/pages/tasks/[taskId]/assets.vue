<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

const route = useRoute()
const taskId = computed(() => String(route.params.taskId))
const { $api } = useNuxtApp() as any

const assets = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const filename = ref('')
const contentType = ref('application/octet-stream')
const file = ref<File | null>(null)
const uploading = ref(false)
const toast = useToast()

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const res = await $api(`/tasks/${taskId.value}/assets`)
    assets.value = res.assets || []
  } catch (e: any) {
    error.value = e?.message || 'Failed to load assets'
  } finally {
    loading.value = false
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] || null
  file.value = f
  filename.value = f?.name || ''
  contentType.value = f?.type || 'application/octet-stream'
}

async function upload() {
  if (!file.value) return
  uploading.value = true
  error.value = null
  try {
    // API returns a presigned PUT url + the asset row
    const res = await $api(`/tasks/${taskId.value}/assets`, {
      method: 'POST',
      body: { filename: filename.value || file.value.name, contentType: contentType.value }
    })

    const putUrl = res.uploadUrl || res.url
    if (!putUrl) throw new Error('Missing uploadUrl')

    await $fetch(putUrl, {
      method: 'PUT',
      body: file.value,
      headers: { 'Content-Type': contentType.value }
    })

    file.value = null
    filename.value = ''
    toast.push({ kind: 'success', title: 'File uploaded' })
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Upload failed'
    toast.push({ kind: 'error', title: 'Upload failed', message: error.value })
  } finally {
    uploading.value = false
  }
}

async function remove(assetId: string) {
  error.value = null
  try {
    await $api(`/assets/${assetId}`, { method: 'DELETE' })
    toast.push({ kind: 'success', title: 'File deleted' })
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Delete failed'
    toast.push({ kind: 'error', title: 'Delete failed', message: error.value })
  }
}

onMounted(refresh)
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="app-title text-3xl font-semibold tracking-tight">Attachments</h1>
        <p class="text-xs text-slate-400 font-mono mt-1">Task #{{ taskId }}</p>
      </div>
      <NuxtLink to="/teams"><AppButton variant="ghost">Equipes</AppButton></NuxtLink>
    </header>

    <p v-if="error" class="text-sm text-red-200">{{ error }}</p>

    <AppCard>
      <div class="flex items-center justify-between">
        <div class="text-sm text-slate-300">Upload</div>
        <div class="text-xs text-slate-400">S3 presigned PUT</div>
      </div>
      <div class="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <input type="file" class="text-sm text-slate-200" @change="onFileChange" />
        <div class="flex-1" />
        <AppButton variant="primary" :disabled="!file || uploading" @click="upload">
          {{ uploading ? 'Uploading…' : 'Upload file' }}
        </AppButton>
      </div>
    </AppCard>

    <AppCard>
      <div class="flex items-center justify-between">
        <div class="text-sm text-slate-300">Files</div>
        <AppButton size="sm" variant="ghost" @click="refresh">Actualiser</AppButton>
      </div>

      <div v-if="loading" class="mt-3 text-slate-300">Chargement…</div>
      <div v-else-if="!assets.length" class="mt-3 text-slate-200">Aucun fichier.</div>
      <ul v-else class="mt-4 space-y-2 text-sm text-slate-200">
        <li v-for="a in assets" :key="a.id" class="rounded-2xl border border-white/10 bg-black/15 p-3">
          <div class="flex items-center justify-between gap-3">
            <a :href="a.s3_url" target="_blank" class="underline break-all">{{ a.filename || a.s3_url }}</a>
            <AppButton size="sm" variant="danger" @click="remove(String(a.id))">Delete</AppButton>
          </div>
        </li>
      </ul>
    </AppCard>
  </div>
</template>

