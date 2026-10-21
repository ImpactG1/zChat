import React from 'react';

export interface TrackedBadgeProps {
  label: string;
  variant?: 'neutral' | 'online' | 'relay' | 'warning' | 'error' | 'chrome';
  withDot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TrackedBadge: React.FC<TrackedBadgeProps> = ({
  label,
  variant = 'neutral',
  withDot = true,
  className,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'online':
        return {
          bg: 'rgba(232, 236, 242, 0.08)',
          border: 'rgba(232, 236, 242, 0.35)',
          text: '#ffffff',
          dot: '#e8ecf2',
        };
      case 'relay':
        return {
          bg: 'rgba(82, 128, 104, 0.12)',
          border: 'rgba(82, 128, 104, 0.45)',
          text: '#a3d9be',
          dot: '#528068',
        };
      case 'warning':
        return {
          bg: 'rgba(153, 115, 62, 0.12)',
          border: 'rgba(153, 115, 62, 0.45)',
          text: '#fbd38d',
          dot: '#99733e',
        };
      case 'error':
        return {
          bg: 'rgba(139, 52, 52, 0.15)',
          border: 'rgba(139, 52, 52, 0.5)',
          text: '#fca5a5',
          dot: '#8b3434',
        };
      case 'chrome':
        return {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.65)',
          text: '#ffffff',
          dot: '#ffffff',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.15)',
          text: 'var(--text-secondary)',
          dot: 'var(--text-muted)',
        };
    }
  };

  const c = getColors();

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '2px',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-micro)',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: c.text,
        fontWeight: 600,
        userSelect: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      {withDot && (
        <span
          style={{
            width: '4px',
            height: '4px',
            background: c.dot,
            borderRadius: '0px',
            transform: 'rotate(45deg)', // Diamond
            boxShadow: variant === 'online' || variant === 'chrome' ? '0 0 6px rgba(255, 255, 255, 0.8)' : 'none',
          }}
        />
      )}
      <span>{label}</span>
    </span>
  );
};
