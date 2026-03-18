<script setup lang="ts">
const auth = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function loginPassword() {
  error.value = null
  loading.value = true
  try {
    await auth.loginWithPassword(email.value, password.value)
    if (auth.me.value?.role !== 'admin') throw new Error('Not an admin')
    await router.push('/admin')
  } catch (e: any) {
    error.value = e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md">
    <h1 class="text-2xl font-semibold">Admin Login</h1>
    <p class="text-sm text-slate-300 mt-1">Connexion admin via Cognito. L’accès sera refusé si rôle ≠ admin.</p>

    <div class="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="space-y-2">
        <input v-model="email" class="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2" placeholder="email" />
        <input
          v-model="password"
          type="password"
          class="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
          placeholder="password"
        />
        <button
          class="w-full rounded-xl bg-purple-400/20 text-purple-50 px-3 py-2 text-sm font-semibold hover:bg-purple-400/25 transition disabled:opacity-60"
          :disabled="loading"
          @click="loginPassword"
        >
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>
        <p v-if="error" class="text-sm text-red-200">{{ error }}</p>
      </div>
    </div>

    <div class="mt-4 text-sm text-slate-200">
      Pas de compte ?
      <NuxtLink to="/register" class="underline">Créer un compte</NuxtLink>
    </div>
  </div>
</template>

