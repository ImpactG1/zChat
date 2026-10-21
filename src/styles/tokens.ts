/**
 * ZENYTH // DUELING GROUNDS
 * Strict TypeScript Design Tokens
 */

export const TOKENS = {
  colors: {
    void0: '#000000',
    void1: '#050608',
    void2: '#0b0d11',
    void3: '#12151c',
    void4: '#191d26',

    chromeHighlight: '#ffffff',
    chromeSheen: '#dcdfe4',
    chromeMid: '#7e8490',
    chromeShadow: '#282b32',
    chromeDeep: '#14161a',

    textWhite: '#f5f7fa',
    textSilver: '#dcdfe4',
    textMuted: '#8c93a0',
    textFaint: '#343840',
    textInverse: '#050608',

    statusOnline: '#e8ecf2',
    statusRelayOk: '#528068',
    statusWarning: '#99733e',
    statusError: '#8b3434',
    statusEncrypted: '#a6b2c2',
  },
  typography: {
    display: "'Cinzel', Georgia, serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
    sizes: {
      micro: '10px',
      caption: '12px',
      bodySm: '13px',
      body: '14px',
      subhead: '16px',
      title: '20px',
      monumental: '36px',
    },
    tracking: {
      micro: '0.3em',
      caption: '0.08em',
      body: '0.01em',
      subhead: '0.08em',
      title: '0.18em',
      monumental: '0.25em',
    },
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    12: '48px',
  },
  radius: {
    sharp: '0px',
    micro: '2px',
    chamfer: '6px',
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
  motion: {
    easeCinematic: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeSlice: 'cubic-bezier(0.22, 1, 0.36, 1)',
    springBlade: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    durationSlice: '160ms',
    durationFast: '140ms',
    durationNormal: '260ms',
    durationDrift: '12000ms',
    durationShimmer: '2400ms',
  },
} as const;

export type DesignTokens = typeof TOKENS;
