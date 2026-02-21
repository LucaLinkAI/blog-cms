"use client";

import { create } from "zustand";

interface UiStore {
  isMediaPickerOpen: boolean;
  isCommandMenuOpen: boolean;
  openMediaPicker: () => void;
  closeMediaPicker: () => void;
  toggleCommandMenu: () => void;
  closeCommandMenu: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isMediaPickerOpen: false,
  isCommandMenuOpen: false,

  openMediaPicker: () => set({ isMediaPickerOpen: true }),
  closeMediaPicker: () => set({ isMediaPickerOpen: false }),
  toggleCommandMenu: () =>
    set((state) => ({ isCommandMenuOpen: !state.isCommandMenuOpen })),
  closeCommandMenu: () => set({ isCommandMenuOpen: false }),
}));
