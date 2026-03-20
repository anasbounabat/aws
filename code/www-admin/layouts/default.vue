<template>
  <div class="flex h-screen bg-slate-900 text-slate-100">
    <aside class="w-64 bg-slate-800 p-6 border-r border-slate-700">
      <h1 class="text-xl font-black text-red-500 mb-8">ADMIN PANEL</h1>
      <nav class="space-y-3 text-sm font-medium">
        <NuxtLink to="/admin/stats" class="block py-2 hover:bg-slate-700 px-3 rounded">📊 Statistiques</NuxtLink>
        <NuxtLink to="/admin/users" class="block py-2 hover:bg-slate-700 px-3 rounded">👥 Utilisateurs</NuxtLink>
        <NuxtLink to="/admin/backups" class="block py-2 hover:bg-slate-700 px-3 rounded">💾 Backups S3</NuxtLink>
      </nav>
      <div class="mt-8 text-xs text-slate-400">
        <NuxtLink to="/login" class="hover:text-slate-200">Login</NuxtLink>
      </div>
    </aside>
    <main class="flex-1 p-8 overflow-y-auto bg-slate-900">
      <slot />
    </main>
  </div>
</template>

