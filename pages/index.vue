<script setup lang="ts">
const auth = useAuth()

await navigateTo(auth.token.value ? '/dashboard' : '/login')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center text-slate-600">
    Redirecting...
  </div>
</template>

