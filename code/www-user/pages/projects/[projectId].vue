<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

type Status = 'TODO' | 'DOING' | 'DONE'

import draggable from 'vuedraggable'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId))
const { $api } = useNuxtApp() as any

const project = ref<any | null>(null)
const tasks = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const newTitle = ref('')
const newDescription = ref('')
const taskFiles = ref<File[]>([])
const createOpen = ref(false)
const activeTask = ref<any | null>(null)
const taskOpen = computed(() => !!activeTask.value)
const toast = useToast()

const listByStatus = computed<Record<Status, any[]>>(() => {
  const out: Record<Status, any[]> = { TODO: [], DOING: [], DONE: [] }
  for (const t of tasks.value) {
    const s = (t.status || 'TODO') as Status
    if (s === 'TODO' || s === 'DOING' || s === 'DONE') out[s].push(t)
  }
  return out
})

const columns: { key: Status; label: string }[] = [
  { key: 'TODO', label: 'A faire' },
  { key: 'DOING', label: 'En cours' },
  { key: 'DONE', label: 'Termine' }
]

function byStatus(s: Status) {
  return tasks.value.filter((t) => (t.status || 'TODO') === s)
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    project.value = (await $api(`/projects/${projectId.value}`)).project
    tasks.value = (await $api(`/projects/${projectId.value}/tasks`)).tasks || []
  } catch (e: any) {
    error.value = e?.message || 'Impossible de charger le projet'
  } finally {
    loading.value = false
  }
}

async function createTask() {
  if (!newTitle.value.trim()) return
  error.value = null
  try {
    const created = await $api(`/projects/${projectId.value}/tasks`, {
      method: 'POST',
      body: { title: newTitle.value.trim(), description: newDescription.value.trim() || null }
    })

    const taskId = String(created?.task?.id || '')
    if (taskId && taskFiles.value.length) {
      for (const f of taskFiles.value) {
        const r = await $api(`/tasks/${taskId}/assets`, {
          method: 'POST',
          body: { filename: f.name, contentType: f.type || 'application/octet-stream' }
        })
        const putUrl = r.uploadUrl || r.url
        if (!putUrl) throw new Error('Missing uploadUrl')
        await $fetch(putUrl, {
          method: 'PUT',
          body: f,
          headers: { 'Content-Type': f.type || 'application/octet-stream' }
        })
      }
    }

    newTitle.value = ''
    newDescription.value = ''
    taskFiles.value = []
    createOpen.value = false
    toast.push({ kind: 'success', title: 'Mission creee' })
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Impossible de creer la mission'
    toast.push({ kind: 'error', title: 'Echec de creation', message: error.value })
  }
}

async function setStatus(taskId: string, status: Status) {
  error.value = null
  try {
    await $api(`/tasks/${taskId}/status`, { method: 'PATCH', body: { status } })
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Impossible de changer le statut'
  }
}

async function removeTask(taskId: string) {
  error.value = null
  try {
    await $api(`/tasks/${taskId}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Impossible de supprimer la mission'
  }
}

async function onMoved(status: Status, evt: any) {
  const moved = evt?.added?.element || null
  if (!moved?.id) return
  await setStatus(String(moved.id), status)
}

onMounted(refresh)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="app-title text-3xl font-semibold tracking-tight">{{ project?.name || 'Tableau projet' }}</h1>
        <p v-if="project?.description" class="text-sm text-slate-300 mt-1">{{ project.description }}</p>
        <p class="text-xs text-slate-400 font-mono mt-1">Project #{{ projectId }}</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/teams"><AppButton variant="secondary">Nouvelle equipe</AppButton></NuxtLink>
        <NuxtLink to="/teams"><AppButton variant="ghost">Equipes</AppButton></NuxtLink>
        <AppButton variant="ghost" @click="refresh">Actualiser</AppButton>
      </div>
    </header>

    <p v-if="error" class="text-sm text-red-200">{{ error }}</p>

    <div class="flex items-center justify-between">
      <div class="text-sm text-slate-300">Tableau</div>
      <AppButton variant="primary" @click="createOpen = true">Nouvelle mission</AppButton>
    </div>

    <div v-if="loading" class="text-slate-300">Chargement…</div>

    <section v-else class="flex gap-4 overflow-x-auto pb-2">
      <div
        v-for="c in columns"
        :key="c.key"
        class="min-w-[340px] w-[340px] rounded-2xl app-border border app-surface p-3"
      >
        <div class="flex items-center justify-between px-1 py-1">
          <div class="flex items-center gap-2">
            <h2 class="text-sm text-slate-100 font-semibold">{{ c.label }}</h2>
            <span class="text-xs rounded-lg bg-white/5 app-border border px-2 py-0.5 text-slate-300">
              {{ listByStatus[c.key].length }}
            </span>
          </div>
          <AppButton size="sm" variant="ghost" @click="createOpen = true">+</AppButton>
        </div>

        <draggable
          :list="listByStatus[c.key]"
          group="tasks"
          item-key="id"
          class="mt-2 space-y-3 min-h-[48px]"
          ghost-class="opacity-40"
          @change="(evt) => onMoved(c.key, evt)"
        >
          <template #item="{ element: t }">
            <div
              class="rounded-2xl app-border border app-card p-4 hover:shadow-soft transition cursor-pointer group"
              @click="activeTask = t"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-slate-100 font-semibold truncate">{{ t.title }}</div>
                  <div v-if="t.description" class="text-sm text-slate-300 mt-1 line-clamp-1">{{ t.description }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="h-7 w-7 rounded-full bg-white/10 app-border border grid place-items-center text-xs text-slate-200">
                    {{ (t.assigned_to_sub || '?').toString().slice(0, 1).toUpperCase() }}
                  </span>
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between gap-2">
                <div class="text-xs text-slate-400 font-mono">#{{ t.id }}</div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <NuxtLink :to="`/tasks/${t.id}/assets`" @click.stop>
                    <AppButton size="sm" variant="ghost">📎</AppButton>
                  </NuxtLink>
                  <AppButton size="sm" variant="ghost" @click.stop="activeTask = t">Editer</AppButton>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </section>

    <AppModal
      :open="createOpen"
      title="Creer une mission"
      description="Nom, mission et images optionnelles."
      @close="createOpen = false"
    >
      <div class="space-y-4">
        <AppField label="Nom de la mission">
          <AppInput v-model="newTitle" placeholder="Ex: Analyser les ventes T1" />
        </AppField>
        <AppField label="Description / Mission" hint="optionnel">
          <AppTextarea v-model="newDescription" placeholder="Contexte et objectif..." :rows="6" />
        </AppField>
        <AppField label="Images" hint="optionnel (png/jpg/webp)">
          <TaskImageUpload v-model:files="taskFiles" />
        </AppField>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="createOpen = false">Annuler</AppButton>
          <AppButton variant="primary" :disabled="!newTitle.trim()" @click="createTask">Creer</AppButton>
        </div>
      </div>
    </AppModal>

    <AppDrawer :open="taskOpen" :title="activeTask?.title || 'Mission'" :description="`#${activeTask?.id || ''}`" @close="activeTask = null">
      <TaskModal
        :open="true"
        :task="activeTask"
        @close="activeTask = null"
        @saved="
          () => {
            activeTask = null
            refresh()
          }
        "
        @deleted="
          () => {
            activeTask = null
            refresh()
          }
        "
      />
    </AppDrawer>
  </div>
</template>

