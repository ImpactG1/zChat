import React from 'react';
import { SoundEngine } from '@/core/feedback/soundEffects';

export interface ChromeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  chamfered?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const ChromeButton: React.FC<ChromeButtonProps> = ({
  children,
  variant = 'solid',
  size = 'md',
  chamfered = true,
  icon,
  isLoading = false,
  onClick,
  className = '',
  disabled,
  style,
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    SoundEngine.playBladeTick();
    onClick?.(e);
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '6px 12px',
      fontSize: '11px',
      letterSpacing: '0.15em',
      minHeight: '32px',
    },
    md: {
      padding: '10px 18px',
      fontSize: '12px',
      letterSpacing: '0.2em',
      minHeight: '44px', // WCAG 44px touch target
    },
    lg: {
      padding: '14px 26px',
      fontSize: '13px',
      letterSpacing: '0.25em',
      minHeight: '50px',
    },
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'solid':
        return {
          background: 'var(--gradient-chrome-surface)',
          color: 'var(--text-inverse)',
          border: 'none',
          boxShadow: '0 1px 12px rgba(255, 255, 255, 0.15)',
        };
      case 'outline':
        return {
          background: 'rgba(11, 13, 17, 0.88)',
          color: 'var(--text-white)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--text-silver)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          background: 'rgba(139, 52, 52, 0.18)',
          color: '#fca5a5',
          border: '1px solid rgba(139, 52, 52, 0.65)',
        };
    }
  };

  const chamferClass = chamfered ? 'chamfer-sm' : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${chamferClass} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        textTransform: 'uppercase',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      {...rest}
    >
      {/* Specular Shimmer overlay on loading */}
      {isLoading && (
        <span
          className="anim-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
