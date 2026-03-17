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
    await auth.register(email.value, password.value)
    await router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Register failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="title text-3xl">Create your account</h1>
    <p class="muted mt-1 text-sm leading-relaxed">
      Minimal setup. You’ll get a personal team and can create projects right away.
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <div class="space-y-1">
        <label class="text-sm font-medium text-ink-950/80">Email</label>
        <input v-model="email" type="email" required class="input" placeholder="you@company.com" />
      </div>
      <div class="space-y-1">
        <label class="text-sm font-medium text-ink-950/80">Password</label>
        <input v-model="password" type="password" required minlength="8" class="input" placeholder="At least 8 characters" />
        <p class="text-xs text-ink-950/50">Min 8 characters.</p>
      </div>

      <div v-if="error" class="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
        {{ error }}
      </div>

      <button class="btn-primary w-full" :disabled="loading">
        {{ loading ? 'Creating…' : 'Create account' }}
      </button>
    </form>

    <div class="mt-5 text-sm text-ink-950/70">
      Already have an account?
      <NuxtLink to="/login" class="font-medium text-ink-950 underline underline-offset-4">Login</NuxtLink>
    </div>
  </div>
</template>

