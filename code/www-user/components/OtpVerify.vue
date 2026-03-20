<script setup lang="ts">
const props = defineProps<{
  email: string
  loading?: boolean
}>()

const emit = defineEmits<{ (e: 'verify', code: string): void; (e: 'resend'): void }>()

const digits = ref<string[]>(['', '', '', '', '', ''])
const inputRefs = ref<(HTMLInputElement | null)[]>(Array(6).fill(null))

const code = computed(() => digits.value.join(''))

function handleInput(index: number, value: string) {
  if (value.length > 1) return
  const next = [...digits.value]
  next[index] = value
  digits.value = next
  if (value && index < 5) inputRefs.value[index + 1]?.focus()
}

function handleKeydown(index: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

function submit() {
  if (code.value.length !== 6) return
  emit('verify', code.value)
}
</script>

<template>
  <div class="rounded-2xl border border-slate-600/50 bg-slate-800/80 p-6 shadow-xl">
    <div class="text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-white">Vérifiez votre email</h2>
      <p class="mt-2 text-sm text-slate-400">
        Un code à 6 chiffres a été envoyé à<br />
        <span class="font-medium text-white">{{ email }}</span>
      </p>
    </div>

    <div class="mt-6 flex justify-center gap-2">
      <input
        v-for="(_, i) in digits"
        :key="i"
        :ref="(el) => (inputRefs[i] = el as HTMLInputElement)"
        :value="digits[i]"
        type="text"
        inputmode="numeric"
        maxlength="1"
        class="h-12 w-11 rounded-xl border border-slate-500 bg-slate-700/80 text-center text-lg font-medium text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
        @input="handleInput(i, ($event.target as HTMLInputElement).value)"
        @keydown="handleKeydown(i, $event)"
      />
    </div>

    <div class="mt-6 space-y-3">
      <button
        type="button"
        :disabled="loading || code.length !== 6"
        class="w-full rounded-lg bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
        @click="submit"
      >
        {{ loading ? 'Vérification…' : 'Valider' }}
      </button>
      <p class="text-center text-sm text-slate-400">
        Pas reçu ?
        <button type="button" class="font-medium text-indigo-300 underline hover:text-indigo-200" @click="$emit('resend')">
          Renvoyer le code
        </button>
      </p>
    </div>
  </div>
</template>
