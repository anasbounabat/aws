<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useHead({
  title: 'Inscription admin',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const auth = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const code = ref('')
const step = ref<'signup' | 'confirm'>('signup')
const loading = ref(false)
const error = ref<string | null>(null)
const info = ref<string | null>(null)
const codeEl = ref<HTMLInputElement | null>(null)

async function submitSignup() {
  error.value = null
  info.value = null
  loading.value = true
  try {
    await auth.register(email.value, password.value)
    step.value = 'confirm'
    info.value = 'Un code de confirmation a été envoyé par email.'
    await nextTick()
    codeEl.value?.focus()
  } catch (e: any) {
    error.value = e?.message || 'Register failed'
  } finally {
    loading.value = false
  }
}

async function submitConfirm() {
  error.value = null
  info.value = null
  if (!code.value.trim()) {
    error.value = 'Le code est requis.'
    return
  }
  loading.value = true
  try {
    await auth.confirm(email.value, code.value)
    info.value = 'Compte confirmé. Connecte-toi avec ton compte admin.'
    setTimeout(() => router.push('/login'), 700)
  } catch (e: any) {
    error.value = e?.message || 'Confirmation failed'
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
  } catch (e: any) {
    error.value = e?.message || 'Resend failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md rounded-2xl border border-slate-600/50 bg-slate-800/80 p-6 shadow-xl">
    <h1 class="text-xl font-semibold text-white">Inscription admin</h1>
    <p class="mt-1 text-sm text-slate-400">Création de compte via Cognito (email / mot de passe)</p>

    <div class="mt-6 space-y-4">
      <div>
        <label for="admin-reg-email" class="mb-1.5 block text-sm font-medium text-slate-200">Email</label>
        <input
          id="admin-reg-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="vous@exemple.com"
          :disabled="step === 'confirm'"
          class="w-full rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 disabled:opacity-70"
        />
      </div>

      <template v-if="step === 'signup'">
        <div>
          <label for="admin-reg-password" class="mb-1.5 block text-sm font-medium text-slate-200">Mot de passe</label>
          <input
            id="admin-reg-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <button
          type="button"
          class="w-full rounded-lg bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:pointer-events-none disabled:opacity-50"
          :disabled="loading"
          @click="submitSignup"
        >
          {{ loading ? 'Création…' : 'Créer mon compte' }}
        </button>
      </template>

      <template v-else>
        <div>
          <label for="admin-reg-code" class="mb-1.5 block text-sm font-medium text-slate-200">Code reçu par email</label>
          <input
            id="admin-reg-code"
            ref="codeEl"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="123456"
            class="w-full rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <button
          type="button"
          class="w-full rounded-lg bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:pointer-events-none disabled:opacity-50"
          :disabled="loading"
          @click="submitConfirm"
        >
          {{ loading ? 'Validation…' : 'Confirmer' }}
        </button>
        <button
          type="button"
          class="w-full rounded-lg border border-slate-500 bg-slate-700/50 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          :disabled="loading"
          @click="resend"
        >
          Renvoyer le code
        </button>
      </template>

      <p v-if="info" class="text-sm text-indigo-300">{{ info }}</p>
      <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
    </div>

    <p class="mt-6 text-center text-sm text-slate-400">
      Déjà un compte ?
      <NuxtLink to="/login" class="font-medium text-indigo-300 underline hover:text-indigo-200">Connexion admin</NuxtLink>
    </p>
  </div>
</template>
