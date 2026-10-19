import { create } from 'zustand';
import { GamerTheme } from '@/types';
import { applyTheme } from '@/styles/themes';

interface ThemeState {
  currentTheme: GamerTheme;
  setTheme: (theme: GamerTheme) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: 'cyberpunk',

  initTheme: () => {
    const saved = (localStorage.getItem('zchat_active_theme') as GamerTheme) || 'cyberpunk';
    applyTheme(saved);
    set({ currentTheme: saved });
  },

  setTheme: (theme: GamerTheme) => {
    applyTheme(theme);
    set({ currentTheme: theme });
  },
}));
