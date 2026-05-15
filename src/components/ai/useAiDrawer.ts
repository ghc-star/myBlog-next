import { create } from "zustand";

interface AiDrawerState {
  open: boolean;
  toggle: () => void;
  setOpen: (value: boolean) => void;
}

export const useAiDrawer = create<AiDrawerState>((set) => ({
  open: false,
  toggle: () => set((state) => ({ open: !state.open })),
  setOpen: (value) => set({ open: value }),
}));
