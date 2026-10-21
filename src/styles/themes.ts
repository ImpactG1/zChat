import { GamerTheme } from '@/types';

export interface ThemeProperties {
  name: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGlow: string;
  bgPrimary: string;
  bgCard: string;
}

export const THEMES: Record<GamerTheme, ThemeProperties> = {
  stealth: {
    name: 'Obsidian Void',
    accentPrimary: '#ffffff',
    accentSecondary: '#8c93a0',
    accentGlow: 'rgba(255, 255, 255, 0.25)',
    bgPrimary: '#000000',
    bgCard: '#0b0d11',
  },
  cyberpunk: {
    name: 'Liquid Chrome',
    accentPrimary: '#f5f7fa',
    accentSecondary: '#7e8490',
    accentGlow: 'rgba(255, 255, 255, 0.35)',
    bgPrimary: '#000000',
    bgCard: '#0b0d11',
  },
  tactical: {
    name: 'Deep Monolith',
    accentPrimary: '#dcdfe4',
    accentSecondary: '#528068',
    accentGlow: 'rgba(82, 128, 104, 0.2)',
    bgPrimary: '#020304',
    bgCard: '#080a0d',
  },
  crimson: {
    name: 'Dried Crimson',
    accentPrimary: '#e0e4ec',
    accentSecondary: '#8b3434',
    accentGlow: 'rgba(139, 52, 52, 0.25)',
    bgPrimary: '#040102',
    bgCard: '#0d0607',
  },
};

export function applyTheme(themeKey: GamerTheme): void {
  const t = THEMES[themeKey] || THEMES.stealth;
  const root = document.documentElement;
  root.style.setProperty('--accent-cyan', t.accentPrimary);
  root.style.setProperty('--accent-cyan-glow', t.accentGlow);
  root.style.setProperty('--accent-purple', t.accentSecondary);
  root.style.setProperty('--bg-primary', t.bgPrimary);
  root.style.setProperty('--bg-card', t.bgCard);
  localStorage.setItem('zchat_active_theme', themeKey);
}
