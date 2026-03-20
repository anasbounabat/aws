<script setup lang="ts">
const auth = useAuth()

onMounted(() => {
  auth.loadMe()
})
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-if="auth.me" class="hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div class="min-w-0">
        <div class="text-xs text-slate-200 truncate max-w-[180px]">
          {{ auth.me.name || auth.me.email }}
        </div>
        <div class="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{{ auth.me.sub }}</div>
      </div>
      <div class="text-[11px] rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-slate-200">
        {{ auth.me.role }}
      </div>
    </div>

    <template v-if="!auth.me">
      <NuxtLink to="/login">
        <AppButton size="sm" variant="ghost">Login</AppButton>
      </NuxtLink>
      <NuxtLink to="/register">
        <AppButton size="sm" variant="secondary">Register</AppButton>
      </NuxtLink>
    </template>
    <AppButton v-else size="sm" variant="ghost" @click="auth.logout()">Logout</AppButton>
  </div>
</template>

