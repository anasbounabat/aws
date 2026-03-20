<script setup lang="ts">
const q = ref('')
const emit = defineEmits<{ (e: 'search', q: string): void; (e: 'quickAdd'): void }>()
</script>

<template>
  <div class="h-14 px-4 flex items-center justify-between gap-3 app-border border-b app-surface">
    <div class="flex items-center gap-2 min-w-0">
      <div class="text-sm font-semibold text-slate-100 app-title truncate">Boards</div>
    </div>

    <div class="flex items-center gap-2 flex-1 justify-center">
      <div class="w-full max-w-md">
        <input
          v-model="q"
          class="w-full rounded-xl app-border border bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-400/30"
          placeholder="Search tasks, projects…"
          @input="emit('search', q)"
        />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <AppButton size="sm" variant="primary" @click="emit('quickAdd')">+ New</AppButton>
      <UserMenu />
    </div>
  </div>
</template>

