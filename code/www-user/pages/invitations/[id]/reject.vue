<script setup lang="ts">
const auth = useAuth()
const route = useRoute()
const { $api } = useNuxtApp() as any

const id = computed(() => String(route.params.id))
const state = ref<'loading' | 'done' | 'error'>('loading')

onMounted(async () => {
  try {
    await auth.loadMe()
    await $api(`/invitations/${id.value}/reject`, { method: 'POST' })
    state.value = 'done'
    setTimeout(() => navigateTo('/dashboard'), 800)
  } catch {
    state.value = 'error'
  }
})
</script>

<template>
  <div class="text-slate-200">
    <div v-if="state === 'loading'">Rejecting invitation…</div>
    <div v-else-if="state === 'done'">Invitation rejected. Redirecting…</div>
    <div v-else>Failed. Go back to <NuxtLink class="underline" to="/dashboard">dashboard</NuxtLink>.</div>
  </div>
</template>

