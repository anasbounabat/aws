<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

const auth = useAuth()
const { $api } = useNuxtApp() as any
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const email = ref('')
const name = ref('')

onMounted(async () => {
  loading.value = true
  try {
    const me = await auth.loadMe()
    email.value = me?.email || ''
    name.value = me?.name || ''
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await $api('/me', { method: 'PATCH', body: { name: name.value.trim() || null } })
    await auth.loadMe()
    toast.push({ kind: 'success', title: 'Profil mis a jour' })
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Echec', message: e?.message || 'Veuillez reessayer' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h1 class="text-2xl font-semibold text-slate-100">Mon Profil</h1>
      <p class="text-sm text-slate-400">Consulter et modifier vos informations.</p>
    </header>

    <div v-if="loading" class="text-slate-300">Chargement…</div>

    <div v-else class="rounded-2xl app-border border app-surface p-5 space-y-4">
      <AppField label="Email">
        <AppInput :model-value="email" disabled />
      </AppField>

      <AppField label="Nom">
        <AppInput v-model="name" placeholder="Votre nom" />
      </AppField>

      <div class="flex justify-end">
        <AppButton variant="primary" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
