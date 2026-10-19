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
  cyberpunk: {
    name: 'Cyberpunk Neon',
    accentPrimary: '#00f0ff',
    accentSecondary: '#9d4edd',
    accentGlow: 'rgba(0, 240, 255, 0.35)',
    bgPrimary: '#080a0f',
    bgCard: 'rgba(18, 24, 38, 0.75)',
  },
  tactical: {
    name: 'Tactical Radar',
    accentPrimary: '#10b981',
    accentSecondary: '#f59e0b',
    accentGlow: 'rgba(16, 185, 129, 0.35)',
    bgPrimary: '#0a0e0c',
    bgCard: 'rgba(16, 26, 20, 0.8)',
  },
  crimson: {
    name: 'Crimson Fury',
    accentPrimary: '#ff2a5f',
    accentSecondary: '#ff7700',
    accentGlow: 'rgba(255, 42, 95, 0.35)',
    bgPrimary: '#0f080a',
    bgCard: 'rgba(30, 14, 18, 0.8)',
  },
  stealth: {
    name: 'Ghost Stealth',
    accentPrimary: '#e2e8f0',
    accentSecondary: '#94a3b8',
    accentGlow: 'rgba(226, 232, 240, 0.25)',
    bgPrimary: '#050608',
    bgCard: 'rgba(20, 22, 28, 0.85)',
  },
};

export function applyTheme(themeKey: GamerTheme): void {
  const t = THEMES[themeKey] || THEMES.cyberpunk;
  const root = document.documentElement;
  root.style.setProperty('--accent-cyan', t.accentPrimary);
  root.style.setProperty('--accent-cyan-glow', t.accentGlow);
  root.style.setProperty('--accent-purple', t.accentSecondary);
  root.style.setProperty('--bg-primary', t.bgPrimary);
  root.style.setProperty('--bg-card', t.bgCard);
  localStorage.setItem('zchat_active_theme', themeKey);
}
