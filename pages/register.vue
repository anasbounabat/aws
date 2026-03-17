<script setup lang="ts">
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
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-2xl bg-white shadow p-6">
      <h1 class="text-2xl font-semibold">Register</h1>
      <p class="text-sm text-slate-500 mt-1">Create your account</p>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-sm font-medium">Email</label>
          <input v-model="email" type="email" required class="mt-1 w-full rounded-xl border px-3 py-2" />
        </div>
        <div>
          <label class="text-sm font-medium">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="mt-1 w-full rounded-xl border px-3 py-2"
          />
          <p class="text-xs text-slate-500 mt-1">Min 8 characters.</p>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          class="w-full rounded-xl bg-slate-900 text-white py-2 font-medium disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <div class="mt-4 text-sm text-slate-600">
        Already have an account?
        <NuxtLink to="/login" class="font-medium text-slate-900 underline">Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

