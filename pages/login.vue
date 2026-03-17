<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  error.value = null
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="title text-3xl">Welcome back</h1>
    <p class="muted mt-1 text-sm leading-relaxed">
      Sign in to access your projects and boards.
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <div class="space-y-1">
        <label class="text-sm font-medium text-ink-950/80">Email</label>
        <input v-model="email" type="email" required class="input" placeholder="you@company.com" />
      </div>
      <div class="space-y-1">
        <label class="text-sm font-medium text-ink-950/80">Password</label>
        <input v-model="password" type="password" required class="input" placeholder="••••••••" />
      </div>

      <div v-if="error" class="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
        {{ error }}
      </div>

      <button class="btn-primary w-full" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <div class="mt-5 text-sm text-ink-950/70">
      No account?
      <NuxtLink to="/register" class="font-medium text-ink-950 underline underline-offset-4">Register</NuxtLink>
    </div>
  </div>
</template>

