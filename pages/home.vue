<script setup lang="ts">
// Safety redirect for old links/bookmarks pointing to /home
await navigateTo('/login')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center text-slate-600">
    Redirecting...
  </div>
</template>

