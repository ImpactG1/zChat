import React from 'react';

export interface RazorIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const defaultProps: RazorIconProps = {
  size: 18,
  color: 'currentColor',
  strokeWidth: 1.35,
};

/**
 * 1. Zenyth Blade Emblem Sigil (Tripartite Razor Trident)
 */
export const IconZenythSigil: React.FC<RazorIconProps> = ({ size = 20, color = 'currentColor', className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    {/* Central Blade Spear */}
    <path
      d="M12 2L13.5 7L12 8.5L10.5 7L12 2Z"
      fill={color}
    />
    <path
      d="M12 8.5V17M12 17L13 18.5L12 22L11 18.5L12 17Z"
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    {/* Left Razor Flange */}
    <path
      d="M5 6.5L8.5 11.5L6.5 14L8 16.5L6.5 20L4 12.5L5 6.5Z"
      stroke={color}
      strokeWidth={1.35}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    {/* Right Razor Flange */}
    <path
      d="M19 6.5L15.5 11.5L17.5 14L16 16.5L17.5 20L20 12.5L19 6.5Z"
      stroke={color}
      strokeWidth={1.35}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    {/* Core Diamond */}
    <polygon points="12,12.5 13.5,14 12,15.5 10.5,14" fill={color} />
  </svg>
);

/**
 * 2. Shield Lock (Faceted Cryptographic Defense)
 */
export const IconShieldLock: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path
        d="M12 2.5L20 6V12C20 17 16 21 12 22.5C8 21 4 17 4 12V6L12 2.5Z"
        stroke={p.color}
        strokeWidth={p.strokeWidth}
        strokeLinejoin="miter"
      />
      <rect x="10" y="11" width="4" height="4" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M12 9.5V11" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="12" y1="13" x2="12" y2="14" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 3. Blade Send (Angular Dart Darting Forward)
 */
export const IconBladeSend: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path
        d="M22 2L13 21.5L11 13L2.5 11L22 2Z"
        stroke={p.color}
        strokeWidth={p.strokeWidth}
        strokeLinejoin="miter"
      />
      <line x1="11" y1="13" x2="21.5" y2="2.5" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 4. Relay Monolithic Tower (Antenna & Beam)
 */
export const IconRelayTower: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path d="M12 2V22" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M7 7L12 4L17 7" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M4 11L12 6L20 11" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M8 22L12 14L16 22" stroke={p.color} strokeWidth={p.strokeWidth} />
      <circle cx="12" cy="3" r="1.5" fill={p.color} />
    </svg>
  );
};

/**
 * 5. Faceted Voice Microphone
 */
export const IconVoiceMic: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M5 10V11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11V10" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="12" y1="18" x2="12" y2="22" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="8" y1="22" x2="16" y2="22" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 6. Razor Voice Waveform
 */
export const IconVoiceWave: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <line x1="3" y1="10" x2="3" y2="14" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="7" y1="6" x2="7" y2="18" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="11" y1="3" x2="11" y2="21" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="15" y1="7" x2="15" y2="17" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="19" y1="9" x2="19" y2="15" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 7. Octagonal Search Loupe
 */
export const IconSearchLoupe: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <polygon
        points="10,3 14,3 17,6 17,10 14,13 10,13 7,10 7,6"
        stroke={p.color}
        strokeWidth={p.strokeWidth}
        strokeLinejoin="miter"
      />
      <line x1="14.5" y1="11.5" x2="21" y2="18" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 8. Cryptographic Key Vault
 */
export const IconKeyVault: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke={p.color} strokeWidth={p.strokeWidth} />
      <polygon points="12,8 15,11 12,14 9,11" fill={p.color} />
      <line x1="12" y1="14" x2="12" y2="18" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="12" y1="16" x2="14" y2="16" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 9. Floating Overlay Sigil
 */
export const IconBubbleOverlay: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <polygon points="12,2 22,12 12,22 2,12" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M12 6L14 10L12 12L10 10L12 6Z" fill={p.color} />
      <line x1="12" y1="12" x2="12" y2="18" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 10. Ghost Mode (Slanted Eye)
 */
export const IconGhostMode: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path
        d="M2 12C2 12 6 5 12 5C18 5 22 12 22 12C22 12 18 19 12 19C6 19 2 12 2 12Z"
        stroke={p.color}
        strokeWidth={p.strokeWidth}
      />
      <circle cx="12" cy="12" r="3" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="3" y1="21" x2="21" y2="3" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 11. Click-Through Mode (Hollow Pass-Through Diamond)
 */
export const IconClickThrough: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <polygon points="5,3 19,10 13,13 10,19" stroke={p.color} strokeWidth={p.strokeWidth} strokeLinejoin="miter" />
      <line x1="13" y1="13" x2="21" y2="21" stroke={p.color} strokeWidth={p.strokeWidth} strokeDasharray="2 2" />
    </svg>
  );
};

/**
 * 12. Party Vanguard Crown
 */
export const IconCrown: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path d="M3 18L5 7L9.5 12L12 5L14.5 12L19 7L21 18H3Z" stroke={p.color} strokeWidth={p.strokeWidth} strokeLinejoin="miter" />
      <line x1="3" y1="20" x2="21" y2="20" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 13. Razor Chevron / Back
 */
export const IconChevron: React.FC<RazorIconProps & { direction?: 'left' | 'right' | 'up' | 'down' }> = ({
  direction = 'left',
  ...props
}) => {
  const p = { ...defaultProps, ...props };
  const rotation = direction === 'right' ? 180 : direction === 'up' ? 90 : direction === 'down' ? -90 : 0;
  return (
    <svg
      width={p.size}
      height={p.size}
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      style={{ transform: `rotate(${rotation}deg)`, ...p.style }}
    >
      <path d="M15 19L8 12L15 5" stroke={p.color} strokeWidth={p.strokeWidth} strokeLinejoin="miter" />
    </svg>
  );
};

/**
 * 14. Disappearing Timer / Diamond Sandglass
 */
export const IconTimerSand: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path d="M6 3H18M6 21H18M7 3L12 12L17 3M7 21L12 12L17 21" stroke={p.color} strokeWidth={p.strokeWidth} />
      <polygon points="12,11 13,12 12,13 11,12" fill={p.color} />
    </svg>
  );
};

/**
 * 15. Dual Razor Delivery Checkmarks
 */
export const IconCheckDouble: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path d="M3 13.5L7.5 18L17 7" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M9.5 13.5L13.5 18L22 7" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 16. Razor Copy Blade
 */
export const IconCopyBlade: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <rect x="8" y="8" width="13" height="13" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path d="M16 8V3H3V16H8" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};

/**
 * 17. Incinerate Flame / Burn Message
 */
export const IconTrashFlame: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <path
        d="M12 2C12 2 15 6 15 9C15 10.5 14 12 12 12C10 12 9 10.5 9 9C9 6 12 2 12 2Z"
        fill={p.color}
      />
      <path
        d="M12 7C17 10 20 14 20 18C20 20.5 17 22 12 22C7 22 4 20.5 4 18C4 14 7 10 12 7Z"
        stroke={p.color}
        strokeWidth={p.strokeWidth}
      />
    </svg>
  );
};

/**
 * 18. Razor Settings
 */
export const IconSettingsGears: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <circle cx="12" cy="12" r="3" stroke={p.color} strokeWidth={p.strokeWidth} />
      <path
        d="M12 2V5M12 19V22M2 12H5M19 12H22M5 5L7 7M17 17L19 19M5 19L7 17M17 7L19 5"
        stroke={p.color}
        strokeWidth={p.strokeWidth}
      />
    </svg>
  );
};

/**
 * 19. Fog Wave (Atmospheric mist)
 */
export const IconFogWave: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <line x1="3" y1="7" x2="21" y2="7" stroke={p.color} strokeWidth={p.strokeWidth} strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke={p.color} strokeWidth={p.strokeWidth} strokeLinecap="round" />
      <line x1="4" y1="17" x2="16" y2="17" stroke={p.color} strokeWidth={p.strokeWidth} strokeLinecap="round" />
    </svg>
  );
};

/**
 * 20. Close / Slash
 */
export const IconClose: React.FC<RazorIconProps> = (props) => {
  const p = { ...defaultProps, ...props };
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" className={p.className} style={p.style}>
      <line x1="5" y1="5" x2="19" y2="19" stroke={p.color} strokeWidth={p.strokeWidth} />
      <line x1="19" y1="5" x2="5" y2="19" stroke={p.color} strokeWidth={p.strokeWidth} />
    </svg>
  );
};
