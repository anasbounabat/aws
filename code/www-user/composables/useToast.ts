type ToastKind = 'success' | 'error' | 'info'
export type Toast = { id: string; kind: ToastKind; title: string; message?: string }

export function useToast() {
  const toasts = useState<Toast[]>('ui:toasts', () => [])

  function push(t: Omit<Toast, 'id'>) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    toasts.value = [...toasts.value, { id, ...t }]
    setTimeout(() => dismiss(id), 3500)
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, push, dismiss }
}

