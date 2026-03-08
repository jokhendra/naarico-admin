import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  toggleCollapsed: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
})); 