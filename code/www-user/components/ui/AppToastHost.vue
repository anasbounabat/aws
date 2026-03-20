<script setup lang="ts">
const toast = useToast()

const styles: Record<string, string> = {
  success: 'border-emerald-300/20 bg-emerald-200/10 text-emerald-50',
  error: 'border-red-300/20 bg-red-200/10 text-red-50',
  info: 'border-white/10 bg-white/5 text-slate-50'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[60] w-[min(420px,calc(100vw-2rem))] space-y-2">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="['rounded-2xl border px-4 py-3 shadow-lg backdrop-blur', styles[t.kind]]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-sm font-semibold truncate">{{ t.title }}</div>
            <div v-if="t.message" class="text-sm text-white/80 mt-0.5">{{ t.message }}</div>
          </div>
          <button class="text-xs underline text-white/70 hover:text-white" @click="toast.dismiss(t.id)">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

