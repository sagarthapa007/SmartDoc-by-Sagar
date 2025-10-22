import { create } from "zustand";
export const useUIStore = create((set)=> ({
  pinned: true,
  togglePinned: ()=>set(s=>({ pinned: !s.pinned })),
}));