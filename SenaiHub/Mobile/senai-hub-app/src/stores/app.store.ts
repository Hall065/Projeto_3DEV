import { create } from 'zustand';

export type AppModule = 'hub' | 'connect' | 'grid';

interface AppState {
  activeModule: AppModule;
  sidebarOpen: boolean;
  setActiveModule: (module: AppModule) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'hub',
  sidebarOpen: false,
  setActiveModule: (activeModule) => set({ activeModule }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
