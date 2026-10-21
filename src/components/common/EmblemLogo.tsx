import React from 'react';

export interface EmblemLogoProps {
  size?: number;
  glow?: boolean;
  shimmer?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  alt?: string;
}

export const EmblemLogo: React.FC<EmblemLogoProps> = ({
  size = 36,
  glow = false,
  className = '',
  style,
  onClick,
  alt = 'Zenyth Emblem',
}) => {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Subtle Specular Ambient Halo behind the chrome emblem */}
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: '-10%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(200, 210, 225, 0.04) 45%, transparent 70%)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* High-Res Liquid Chrome Logo - Clean, razor-sharp & static */}
      <img
        src="/logo.png"
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'screen',
          filter: glow
            ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.35)) drop-shadow(0 0 20px rgba(220, 230, 255, 0.15)) brightness(1.18) contrast(1.12)'
            : 'brightness(1.08) contrast(1.08)',
          imageRendering: '-webkit-optimize-contrast',
          position: 'relative',
          zIndex: 1,
        }}
        draggable={false}
      />
    </div>
  );
};
