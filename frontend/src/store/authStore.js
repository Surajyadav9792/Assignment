import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('ff_user') || 'null'),
  token: localStorage.getItem('ff_token'),
  setAuth: (user, token) => {
    localStorage.setItem('ff_user', JSON.stringify(user));
    localStorage.setItem('ff_token', token);
    set({ user, token });
  },
  setUser: (user) => {
    localStorage.setItem('ff_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('ff_user');
    localStorage.removeItem('ff_token');
    set({ user: null, token: null });
  },
}));
