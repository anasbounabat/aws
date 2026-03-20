<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50" @mousedown="onBackdrop">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-xl" />
      <aside
        class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-slate-950/70 border-l border-white/10 backdrop-blur-xl shadow-soft"
        @mousedown.stop
      >
        <div class="h-14 px-5 flex items-center justify-between border-b border-white/10">
          <div class="min-w-0">
            <div class="text-sm font-semibold text-slate-100 truncate">{{ title }}</div>
            <div v-if="description" class="text-xs text-slate-400 truncate">{{ description }}</div>
          </div>
          <AppButton size="sm" variant="ghost" @click="$emit('close')">Fermer</AppButton>
        </div>
        <div class="p-5 overflow-auto h-[calc(100%-3.5rem)]">
          <slot />
        </div>
      </aside>
    </div>
  </Teleport>
</template>

