<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
  error?: string | null
}>()
</script>

<template>
  <label class="block space-y-1.5">
    <div class="flex items-end justify-between gap-3">
      <div class="text-sm text-slate-200">{{ label }}</div>
      <div v-if="hint" class="text-xs text-slate-400">{{ hint }}</div>
    </div>
    <slot />
    <p v-if="error" class="text-xs text-red-200">{{ error }}</p>
  </label>
</template>

