<script setup lang="ts">
const auth = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const code = ref('')
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
  } catch (e: any) {
    error.value = e?.message || 'Register failed'
  } finally {
    loading.value = false
  }
}

async function submitConfirm() {
  error.value = null
  loading.value = true
  try {
    await auth.confirm(email.value, code.value)
    info.value = 'Compte confirmé. Connecte-toi puis demande le rôle admin.'
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
  <div class="max-w-md">
    <h1 class="text-2xl font-semibold">Admin Register</h1>
    <p class="text-sm text-slate-300 mt-1">Création de compte via Cognito (email/password).</p>

    <div class="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="space-y-2">
        <input v-model="email" class="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2" placeholder="email" />

        <template v-if="step === 'signup'">
          <input
            v-model="password"
            type="password"
            class="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
            placeholder="password"
          />
          <button
            class="w-full rounded-xl bg-purple-400/20 text-purple-50 px-3 py-2 text-sm font-semibold hover:bg-purple-400/25 transition disabled:opacity-60"
            :disabled="loading"
            @click="submitSignup"
          >
            {{ loading ? 'Création…' : 'Créer mon compte' }}
          </button>
        </template>

        <template v-else>
          <input v-model="code" class="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2" placeholder="code reçu par email" />
          <button
            class="w-full rounded-xl bg-purple-400/20 text-purple-50 px-3 py-2 text-sm font-semibold hover:bg-purple-400/25 transition disabled:opacity-60"
            :disabled="loading"
            @click="submitConfirm"
          >
            {{ loading ? 'Validation…' : 'Confirmer' }}
          </button>
          <button class="w-full rounded-xl bg-white/10 hover:bg-white/15 text-slate-50 px-3 py-2 text-sm" :disabled="loading" @click="resend">
            Renvoyer le code
          </button>
        </template>

        <p v-if="info" class="text-sm text-purple-200">{{ info }}</p>
        <p v-if="error" class="text-sm text-red-200">{{ error }}</p>
      </div>
    </div>

    <div class="mt-4 text-sm text-slate-200">
      Déjà un compte ?
      <NuxtLink to="/login" class="underline">Se connecter</NuxtLink>
    </div>
  </div>
</template>

