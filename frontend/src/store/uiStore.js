import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarCollapsed: JSON.parse(localStorage.getItem('ff_sidebar_collapsed') || 'false'),
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      localStorage.setItem('ff_sidebar_collapsed', JSON.stringify(next));
      return { sidebarCollapsed: next };
    }),
  notificationsOpen: false,
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
}));
