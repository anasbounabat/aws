<script setup lang="ts">
const props = defineProps<{
  files: File[]
}>()

const emit = defineEmits<{
  (e: 'update:files', value: File[]): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const previewUrl = ref<string | null>(null)
const fileName = computed(() => (props.files[0] ? props.files[0].name : null))

watch(
  () => props.files,
  (files) => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    if (files && files[0]) {
      previewUrl.value = URL.createObjectURL(files[0])
    }
  },
  { immediate: true, deep: true }
)

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function openPicker() {
  fileInput.value?.click()
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  emit('update:files', files)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
  const fileList = e.dataTransfer?.files
  if (!fileList || !fileList.length) return
  const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
  if (!images.length) return
  emit('update:files', images)
}

function clearFiles() {
  emit('update:files', [])
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="onChange"
    />

    <div v-if="!previewUrl" class="mt-1">
      <div
        class="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-black/20 px-4 text-center text-slate-300 transition hover:border-indigo-400/70 hover:bg-black/30"
        :class="isDragging && 'border-indigo-400 bg-black/40'"
        @click="openPicker"
        @dragover="onDragOver"
        @dragenter="onDragEnter"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 shadow-sm shadow-black/40">
          <span class="text-lg">📷</span>
        </div>
        <div>
          <p class="text-sm font-medium">Click to select</p>
          <p class="text-xs text-slate-400">or drag and drop images here</p>
        </div>
        <p class="text-[11px] text-slate-500">JPG, PNG, WEBP – up to ~10 MB</p>
      </div>
    </div>

    <div v-else class="relative mt-1">
      <div class="group relative h-40 w-full overflow-hidden rounded-2xl border border-white/15 bg-black/30">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Preview"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
        <div class="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            class="rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 shadow"
            @click.stop="openPicker"
          >
            Change
          </button>
          <button
            type="button"
            class="rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow"
            @click.stop="clearFiles"
          >
            Remove
          </button>
        </div>
      </div>
      <div v-if="fileName || files.length" class="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <span class="truncate">{{ fileName || 'Images selected' }}</span>
        <span v-if="files.length > 1" class="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
          +{{ files.length - 1 }} more
        </span>
        <button type="button" class="ml-auto rounded-full px-2 py-1 hover:bg-white/5" @click="clearFiles">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

