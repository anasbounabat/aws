<template>
  <div class="app-shell">
    <div class="flex min-h-screen">
      <SidebarNav :active-team-id="String((useRoute().query.team ?? '') || '') || null" />
      <div class="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main class="p-6 lg:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
  <AppToastHost />
</template>

