<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['redirect-if-auth'] })

const auth = useAuth()
const toast = useToast()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function loginPassword() {
  error.value = null
  loading.value = true
  try {
    await auth.loginWithPassword(email.value, password.value)
    toast.push({ kind: 'success', title: 'Welcome back' })
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e?.message || 'Login failed'
    toast.push({ kind: 'error', title: 'Login failed', message: error.value })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md rounded-2xl border border-slate-600/50 bg-slate-800/80 p-6 shadow-xl">
    <h1 class="text-xl font-semibold text-white">Se connecter</h1>
    <p class="mt-1 text-sm text-slate-400">Entrez votre email et mot de passe</p>

    <form class="mt-6 space-y-4" @submit.prevent="loginPassword">
      <div>
        <label for="login-email" class="mb-1.5 block text-sm font-medium text-slate-200">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="vous@exemple.com"
          class="w-full rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
        />
      </div>

      <div>
        <label for="login-password" class="mb-1.5 block text-sm font-medium text-slate-200">Mot de passe</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          class="w-full rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
        />
      </div>

      <p v-if="error" class="text-sm text-red-300">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading || !email.trim() || !password"
        class="w-full rounded-lg bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none"
      >
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>

      <p class="text-center text-sm text-slate-400">
        Pas de compte ?
        <NuxtLink to="/register" class="font-medium text-indigo-300 underline hover:text-indigo-200">Créer un compte</NuxtLink>
      </p>
    </form>
  </div>
</template>
