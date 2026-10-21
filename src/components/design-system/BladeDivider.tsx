import React from 'react';

export interface BladeDividerProps {
  label?: string;
  withDiamond?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const BladeDivider: React.FC<BladeDividerProps> = ({
  label,
  withDiamond = true,
  className,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        margin: '12px 0',
        ...style,
      }}
    >
      {/* Left Blade Hairline */}
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 100%)',
        }}
      />

      {/* Center Label or Diamond */}
      {label ? (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-micro)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {withDiamond && <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '8px' }}>◆</span>}
          {label}
          {withDiamond && <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '8px' }}>◆</span>}
        </span>
      ) : withDiamond ? (
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '9px', userSelect: 'none' }}>
          ◆
        </span>
      ) : null}

      {/* Right Blade Hairline */}
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0%, transparent 100%)',
        }}
      />
    </div>
  );
};
