<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

const { $api } = useNuxtApp() as any
const toast = useToast()

const loading = ref(true)
const invitations = ref<any[]>([])

async function refresh() {
  loading.value = true
  try {
    const res = await $api('/invitations')
    invitations.value = res.invitations || []
  } finally {
    loading.value = false
  }
}

async function accept(id: number) {
  try {
    await $api(`/invitations/${id}/accept`, { method: 'POST' })
    toast.push({ kind: 'success', title: 'Invitation acceptee' })
    await refresh()
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Echec', message: e?.message || 'Veuillez reessayer' })
  }
}

async function reject(id: number) {
  try {
    await $api(`/invitations/${id}/reject`, { method: 'POST' })
    toast.push({ kind: 'info', title: 'Invitation refusee' })
    await refresh()
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Echec', message: e?.message || 'Veuillez reessayer' })
  }
}

onMounted(refresh)
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Invitations</h1>
        <p class="text-sm text-slate-400">Consulter, accepter ou refuser vos invitations.</p>
      </div>
      <AppButton variant="ghost" @click="refresh">Actualiser</AppButton>
    </header>

    <div v-if="loading" class="text-slate-300">Chargement…</div>
    <div v-else-if="!invitations.length" class="rounded-2xl app-border border app-surface p-5 text-slate-300">
      Aucune invitation en attente.
    </div>
    <ul v-else class="space-y-3">
      <li v-for="i in invitations" :key="i.id" class="rounded-2xl app-border border app-surface p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-slate-100 font-medium">Invitation #{{ i.id }}</div>
            <div class="text-xs text-slate-400">{{ i.email }} · {{ i.status }}</div>
          </div>
          <div class="flex gap-2">
            <AppButton variant="secondary" size="sm" @click="accept(i.id)">Accepter</AppButton>
            <AppButton variant="danger" size="sm" @click="reject(i.id)">Refuser</AppButton>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
