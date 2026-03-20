<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

const auth = useAuth()
// @ts-ignore
const { $api } = useNuxtApp()

const teams = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const name = ref('')
const creating = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const res = await $api('/teams')
    teams.value = res.teams || []
  } catch (e: any) {
    error.value = e?.message || 'Impossible de charger les équipes'
  } finally {
    loading.value = false
  }
}

async function createTeam() {
  if (!name.value.trim()) return
  creating.value = true
  error.value = null
  try {
    const res = await $api('/teams', { method: 'POST', body: { name: name.value.trim() } })
    const toast = useToast()
    toast.push({ kind: 'success', title: 'Équipe créée avec succès' })
    name.value = ''
    await refresh()
  } catch (e: any) {
    error.value = e?.message || "Impossible de créer l'équipe"
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  await auth.loadMe()
  await refresh()
  // Focus the input if they don't have teams
  if (!teams.value.length && inputRef.value) {
    inputRef.value.focus()
  }
})
</script>

<template>
  <div class="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-12">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">Mes équipes</h1>
        <p class="text-sm text-slate-400" v-if="auth.me">
          Connecté(e) en tant que <span class="text-slate-100 font-medium">{{ auth.me.name || auth.me.email }}</span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <AppButton variant="ghost" class="hover:bg-white/5 transition-colors" @click="refresh">Actualiser</AppButton>
      </div>
    </header>

    <p v-if="error" class="text-sm font-medium bg-red-500/10 text-red-300 border border-red-500/20 px-4 py-3 rounded-xl">{{ error }}</p>

    <!-- Inline Team Creation -->
    <div class="rounded-2xl app-border border app-surface p-6 shadow-soft relative overflow-hidden group">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
      <div class="relative z-10 flex flex-col sm:flex-row gap-4 items-end">
        <div class="flex-1 w-full space-y-2">
          <label class="text-sm font-medium text-slate-200">Créer une nouvelle équipe</label>
          <input
            ref="inputRef"
            v-model="name"
            type="text"
            class="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all shadow-inner"
            placeholder="Ex: Direction Marketing, Produit, Design..."
            @keydown.enter.prevent="createTeam"
          />
        </div>
        <AppButton 
          variant="primary" 
          class="shadow-glow h-[46px] w-full sm:w-auto px-6" 
          :disabled="creating || !name.trim()" 
          @click="createTeam"
        >
          {{ creating ? 'Création…' : 'Créer l\'équipe' }}
        </AppButton>
      </div>
    </div>

    <!-- Teams List -->
    <div class="rounded-2xl app-border border app-surface p-6 shadow-soft">
      <div class="flex items-center justify-between mb-6">
        <div class="text-sm font-semibold text-slate-100 tracking-wide">Vos équipes actuelles</div>
        <div class="text-xs text-indigo-300 font-medium px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-sm">{{ teams.length }} au total</div>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-4">
        <div class="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
        <div class="text-sm font-medium text-slate-400 animate-pulse">Chargement…</div>
      </div>
      
      <div v-else-if="!teams.length" class="text-center py-12 px-4 rounded-xl border border-dashed border-white/10 bg-white/5">
        <div class="text-3xl mb-3 grayscale opacity-50">👥</div>
        <div class="text-sm font-medium text-slate-200">Aucune équipe pour le moment.</div>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Utilisez le formulaire ci-dessus pour en créer une. Les équipes vous aident à organiser vos missions et invitations.</p>
      </div>

      <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="t in teams" :key="t.id">
          <NuxtLink :to="`/dashboard?team=${t.id}`" class="block rounded-2xl border border-white/10 app-card p-5 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 group h-full">
            <div class="flex items-start justify-between gap-3 content-between flex-col h-full">
              <div class="w-full">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {{ t.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-slate-100 font-semibold truncate group-hover:text-indigo-200 transition-colors text-lg">{{ t.name }}</div>
                    <div class="text-[11px] text-slate-500 font-mono mt-0.5">Équipe #{{ t.id }}</div>
                  </div>
                </div>
              </div>
              <div class="w-full mt-4 flex justify-end">
                <span class="text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                  Rejoindre l'espace 
                  <span class="transform group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

