<script setup lang="ts">
const route = useRoute()
const auth = useAuth()

function navClass(path: string) {
  const active = route.path === path || route.path.startsWith(path + '/')
  return [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    active
      ? 'bg-violet-500/20 text-white shadow-sm shadow-violet-900/20 ring-1 ring-violet-400/30'
      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
  ].join(' ')
}

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-950 text-slate-100">
    <aside
      class="flex w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/95 backdrop-blur-sm"
    >
      <div class="border-b border-slate-800/80 p-5">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black text-white shadow-lg shadow-violet-900/40"
          >
            A
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/90">Console</p>
            <h1 class="text-lg font-bold tracking-tight text-white">Admin</h1>
          </div>
        </div>
        <p class="mt-3 text-xs leading-relaxed text-slate-500">Gestion de la plateforme</p>
      </div>

      <nav class="flex-1 space-y-1 p-3">
        <NuxtLink to="/admin/stats" :class="navClass('/admin/stats')">
          <span class="text-lg opacity-80" aria-hidden="true">📊</span>
          Tableau de bord
        </NuxtLink>
        <NuxtLink to="/admin/users" :class="navClass('/admin/users')">
          <span class="text-lg opacity-80" aria-hidden="true">👥</span>
          Utilisateurs
        </NuxtLink>
        <NuxtLink to="/admin/backups" :class="navClass('/admin/backups')">
          <span class="text-lg opacity-80" aria-hidden="true">💾</span>
          Backups S3
        </NuxtLink>
      </nav>

      <div class="border-t border-slate-800/80 p-4">
        <p v-if="auth.me.value?.email" class="mb-2 truncate text-xs text-slate-500">
          {{ auth.me.value.email }}
        </p>
        <button
          type="button"
          class="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          @click="logout"
        >
          Déconnexion
        </button>
      </div>
    </aside>

    <main class="relative flex-1 overflow-y-auto">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-6xl p-8 lg:p-10">
        <slot />
      </div>
    </main>
  </div>
</template>
