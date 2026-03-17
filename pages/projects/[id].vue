<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type TaskStatus = 'TODO' | 'DOING' | 'DONE'
type Task = { id: number; title: string; description: string | null; status: TaskStatus; assigned_to: number | null }
type Asset = { id: number; task_id: number; s3_url: string }

const route = useRoute()
const { $api } = useNuxtApp()

const projectId = computed(() => Number(route.params.id))
const project = ref<{ id: number; name: string; team_id: number; team_name: string } | null>(null)
const tasks = ref<Task[]>([])
const assets = ref<Asset[]>([])

const newTitle = ref('')
const newDescription = ref('')
const error = ref<string | null>(null)
const loading = ref(true)

const columns: { key: TaskStatus; title: string }[] = [
  { key: 'TODO', title: 'To do' },
  { key: 'DOING', title: 'Doing' },
  { key: 'DONE', title: 'Done' }
]

const tasksByStatus = computed(() => {
  const map: Record<TaskStatus, Task[]> = { TODO: [], DOING: [], DONE: [] }
  for (const t of tasks.value) map[t.status].push(t)
  return map
})

function taskAssets(taskId: number) {
  return assets.value.filter((a) => a.task_id === taskId)
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const p = await $api<{ project: any }>(`/projects/${projectId.value}`)
    project.value = p.project
    const res = await $api<{ tasks: Task[]; assets: Asset[] }>(`/projects/${projectId.value}/tasks`)
    tasks.value = res.tasks
    assets.value = res.assets
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to load project'
  } finally {
    loading.value = false
  }
}

async function createTask() {
  if (!newTitle.value.trim()) return
  const res = await $api<{ task: Task }>(`/projects/${projectId.value}/tasks`, {
    method: 'POST',
    body: { title: newTitle.value.trim(), description: newDescription.value.trim() || undefined }
  })
  tasks.value = [res.task, ...tasks.value]
  newTitle.value = ''
  newDescription.value = ''
}

async function updateStatus(task: Task, status: TaskStatus) {
  if (task.status === status) return
  const prev = task.status
  task.status = status
  try {
    const res = await $api<{ task: Task }>(`/tasks/${task.id}`, { method: 'PATCH', body: { status } })
    Object.assign(task, res.task)
  } catch (e) {
    task.status = prev
  }
}

async function removeTask(taskId: number) {
  await $api(`/tasks/${taskId}`, { method: 'DELETE' })
  tasks.value = tasks.value.filter((t) => t.id !== taskId)
  assets.value = assets.value.filter((a) => a.task_id !== taskId)
}

onMounted(refresh)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b bg-white">
      <div class="mx-auto max-w-6xl p-4 flex items-center justify-between">
        <div>
          <NuxtLink to="/dashboard" class="text-sm text-slate-600 underline">Back</NuxtLink>
          <div class="text-lg font-semibold mt-1">
            {{ project?.name || 'Project' }}
          </div>
          <div class="text-sm text-slate-500">{{ project?.team_name }}</div>
        </div>
        <button class="text-sm rounded-xl border px-3 py-2" @click="refresh">Refresh</button>
      </div>
    </header>

    <main class="mx-auto max-w-6xl p-4">
      <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>
      <div v-if="loading" class="text-slate-600">Loading…</div>

      <template v-else>
        <section class="rounded-2xl bg-white shadow p-4">
          <h2 class="font-semibold">New task</h2>
          <div class="mt-3 grid md:grid-cols-3 gap-2">
            <input v-model="newTitle" placeholder="Title" class="rounded-xl border px-3 py-2 md:col-span-1" />
            <input
              v-model="newDescription"
              placeholder="Description (optional)"
              class="rounded-xl border px-3 py-2 md:col-span-2"
            />
          </div>
          <div class="mt-3">
            <button class="rounded-xl bg-slate-900 text-white px-3 py-2" @click="createTask">Add</button>
          </div>
        </section>

        <section class="mt-6 grid md:grid-cols-3 gap-4">
          <div v-for="c in columns" :key="c.key" class="rounded-2xl bg-white shadow p-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ c.title }}</h3>
              <div class="text-xs text-slate-500">{{ tasksByStatus[c.key].length }}</div>
            </div>

            <div class="mt-4 space-y-3">
              <div v-for="t in tasksByStatus[c.key]" :key="t.id" class="rounded-2xl border p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="font-medium">{{ t.title }}</div>
                  <button class="text-xs text-red-700 underline" @click="removeTask(t.id)">Delete</button>
                </div>
                <div v-if="t.description" class="text-sm text-slate-600 mt-1">
                  {{ t.description }}
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <label class="text-xs text-slate-500">Status</label>
                  <select
                    class="text-sm rounded-xl border px-2 py-1"
                    :value="t.status"
                    @change="updateStatus(t, ($event.target as HTMLSelectElement).value as any)"
                  >
                    <option value="TODO">TODO</option>
                    <option value="DOING">DOING</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div v-if="taskAssets(t.id).length" class="mt-3">
                  <div class="text-xs text-slate-500">Assets</div>
                  <ul class="mt-1 space-y-1">
                    <li v-for="a in taskAssets(t.id)" :key="a.id" class="text-xs text-slate-700 break-all">
                      {{ a.s3_url }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

