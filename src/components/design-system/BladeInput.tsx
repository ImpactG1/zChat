import React, { useState } from 'react';

export interface BladeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

export const BladeInput: React.FC<BladeInputProps> = ({
  label,
  error,
  leftIcon,
  rightAction,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...containerStyle }}>
      {label && (
        <label
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-micro)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: isFocused ? 'var(--text-white)' : 'var(--text-muted)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color var(--transition-fast)',
          }}
        >
          <span style={{ color: isFocused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', fontSize: '8px' }}>
            ◆
          </span>
          {label}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>

        {leftIcon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              color: isFocused ? 'var(--text-white)' : 'var(--text-muted)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={{
            width: '100%',
            height: '44px', // WCAG target
            background: 'var(--void-1)',
            border: `1px solid ${
              error
                ? 'var(--status-error)'
                : isFocused
                ? 'rgba(255, 255, 255, 0.65)'
                : 'rgba(255, 255, 255, 0.12)'
            }`,
            borderRadius: 'var(--radius-micro)',
            color: 'var(--text-white)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body)',
            paddingLeft: leftIcon ? '40px' : '14px',
            paddingRight: rightAction ? '44px' : '14px',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            boxShadow: isFocused ? '0 0 16px rgba(255, 255, 255, 0.1)' : 'none',
            userSelect: 'text',
            ...style,
          }}
          {...rest}
        />

        {rightAction && (
          <div
            style={{
              position: 'absolute',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            {rightAction}
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            fontSize: '11px',
            color: '#f87171',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '2px',
          }}
        >
          <span>✕</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
