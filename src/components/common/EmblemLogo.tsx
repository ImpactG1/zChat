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
      {/* High-Res Liquid Chrome Logo - Clean, razor-sharp & static */}
      <img
        src="/logo.png"
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 1,
        }}
        draggable={false}
      />
    </div>
  );
};

