<template>
  <div class="min-h-screen bg-black text-slate-50">
    <header class="sticky top-0 border-b border-white/10 bg-black/70 backdrop-blur">
      <div class="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="font-semibold">www-admin</NuxtLink>
        <nav class="text-sm text-slate-200 flex gap-4">
          <NuxtLink to="/login">Login</NuxtLink>
          <NuxtLink to="/register">Register</NuxtLink>
          <NuxtLink to="/admin">Admin</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>

