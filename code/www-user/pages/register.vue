<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['redirect-if-auth'] })

const auth = useAuth()
const toast = useToast()

const email = ref('')
const password = ref('')
const step = ref<'signup' | 'confirm'>('signup')
const loading = ref(false)
const error = ref<string | null>(null)
const info = ref<string | null>(null)

async function submitSignup() {
  error.value = null
  info.value = null
  loading.value = true
  try {
    await auth.register(email.value, password.value)
    step.value = 'confirm'
    info.value = 'Un code de confirmation a été envoyé par email.'
    toast.push({ kind: 'info', title: 'Confirmation email', message: 'Un code a été envoyé. Saisissez-le ci-dessous.' })
  } catch (e: any) {
    error.value = e?.message || 'Inscription impossible'
    toast.push({ kind: 'error', title: 'Inscription', message: error.value })
  } finally {
    loading.value = false
  }
}

async function submitConfirm(code: string) {
  error.value = null
  info.value = null
  loading.value = true
  try {
    await auth.confirm(email.value, code)
    info.value = 'Compte confirmé. Vous pouvez vous connecter.'
    toast.push({ kind: 'success', title: 'Compte confirmé' })
    setTimeout(() => navigateTo('/login'), 700)
  } catch (e: any) {
    error.value = e?.message || 'Confirmation impossible'
    toast.push({ kind: 'error', title: 'Confirmation', message: error.value })
  } finally {
    loading.value = false
  }
}

async function resend() {
  error.value = null
  info.value = null
  loading.value = true
  try {
    await auth.resend(email.value)
    info.value = 'Code renvoyé.'
    toast.push({ kind: 'success', title: 'Code renvoyé' })
  } catch (e: any) {
    error.value = e?.message || 'Envoi impossible'
    toast.push({ kind: 'error', title: 'Renvoyer le code', message: error.value })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <!-- Étape 1 : email + mot de passe -->
    <div v-if="step === 'signup'" class="rounded-2xl border border-slate-600/50 bg-slate-800/80 p-6 shadow-xl">
      <h1 class="text-xl font-semibold text-white">Créer un compte</h1>
      <p class="mt-1 text-sm text-slate-400">Entrez votre email et choisissez un mot de passe</p>

      <form class="mt-6 space-y-4" @submit.prevent="submitSignup">
        <div>
          <label for="reg-email" class="mb-1.5 block text-sm font-medium text-slate-200">Email</label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="vous@exemple.com"
            class="w-full rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>

        <div>
          <label for="reg-password" class="mb-1.5 block text-sm font-medium text-slate-200">Mot de passe</label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>

        <p v-if="info" class="text-sm text-indigo-300">{{ info }}</p>
        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading || !email.trim() || !password"
          class="w-full rounded-lg bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none"
        >
          {{ loading ? 'Création…' : 'Créer un compte' }}
        </button>

        <p class="text-center text-sm text-slate-400">
          Déjà un compte ?
          <NuxtLink to="/login" class="font-medium text-indigo-300 underline hover:text-indigo-200">Se connecter</NuxtLink>
        </p>
      </form>
    </div>

    <!-- Étape 2 : vérification OTP 6 chiffres -->
    <template v-else>
      <p v-if="info" class="mb-3 text-center text-sm text-indigo-300">{{ info }}</p>
      <p v-if="error" class="mb-3 text-center text-sm text-red-300">{{ error }}</p>
      <OtpVerify
        :email="email"
        :loading="loading"
        @verify="submitConfirm"
        @resend="resend"
      />
      <p class="mt-4 text-center text-sm text-slate-400">
        <NuxtLink to="/login" class="font-medium text-indigo-300 underline hover:text-indigo-200">Retour à la connexion</NuxtLink>
      </p>
    </template>
  </div>
</template>
