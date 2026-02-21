"use client";

import { create } from "zustand";
import type { Block } from "@/lib/data/types";

interface EditorStore {
  blocks: Block[];
  isDirty: boolean;
  selectedBlockId: string | null;
  setBlocks: (blocks: Block[]) => void;
  markDirty: () => void;
  markClean: () => void;
  selectBlock: (id: string | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  blocks: [],
  isDirty: false,
  selectedBlockId: null,

  setBlocks: (blocks) => set({ blocks, isDirty: true }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  selectBlock: (id) => set({ selectedBlockId: id }),
  reset: () => set({ blocks: [], isDirty: false, selectedBlockId: null }),
}));
