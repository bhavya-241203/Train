import { create } from 'zustand'
import type { Badge } from '../db/types'

interface Toast {
  id: string
  title: string
  body?: string
  kind: 'badge' | 'levelup' | 'info'
}

interface UiState {
  toasts: Toast[]
  confettiBurstId: number
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  pushBadgeToasts: (badges: Badge[]) => void
  fireConfetti: () => void
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  confettiBurstId: 0,
  pushToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  pushBadgeToasts: (badges) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        ...badges.map((b) => ({ id: crypto.randomUUID(), title: `Badge unlocked: ${b.label}`, body: b.description, kind: 'badge' as const })),
      ],
    })),
  fireConfetti: () => set((s) => ({ confettiBurstId: s.confettiBurstId + 1 })),
}))
