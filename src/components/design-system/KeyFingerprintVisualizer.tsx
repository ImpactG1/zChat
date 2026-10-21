import React, { useMemo } from 'react';
import { IconShieldLock, IconCopyBlade } from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

export interface KeyFingerprintVisualizerProps {
  pubkey: string;
  tag?: string;
  showCopy?: boolean;
  style?: React.CSSProperties;
}

export const KeyFingerprintVisualizer: React.FC<KeyFingerprintVisualizerProps> = ({
  pubkey,
  tag = '#7e2a',
  showCopy = true,
  style,
}) => {
  // Deterministically map 64 hex characters to an 8x8 matrix of luminance & sigil types
  const grid = useMemo(() => {
    const cleanKey = (pubkey || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef').slice(0, 64);
    const cells: { char: string; level: number; isDiamond: boolean }[] = [];
    for (let i = 0; i < 64; i++) {
      const val = parseInt(cleanKey[i] || '0', 16);
      cells.push({
        char: cleanKey[i],
        level: val / 15,
        isDiamond: val % 3 === 0,
      });
    }
    return cells;
  }, [pubkey]);

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(pubkey);
      SoundEngine.playBladeTick();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--void-1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px',
        position: 'relative',
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.8)',
        maxWidth: '300px',
        margin: '0 auto',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconShieldLock size={12} color="var(--status-encrypted)" />
          <span className="tracked-micro" style={{ color: 'var(--text-white)' }}>
            KEY FINGERPRINT
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {tag}
        </span>
      </div>

      {/* 8x8 Cryptographic Glyph Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 24px)',
          gridTemplateRows: 'repeat(8, 24px)',
          gap: '3px',
          padding: '8px',
          background: 'var(--void-0)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {grid.map((cell, idx) => {
          const opacity = 0.15 + cell.level * 0.85;
          return (
            <div
              key={idx}
              title={`Byte ${idx}: ${cell.char}`}
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: cell.isDiamond
                  ? `rgba(255, 255, 255, ${opacity * 0.3})`
                  : `rgba(180, 190, 205, ${opacity * 0.15})`,
                border: `1px solid rgba(255, 255, 255, ${opacity * 0.4})`,
                transition: 'transform var(--transition-fast)',
              }}
            >
              {cell.isDiamond ? (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    background: '#ffffff',
                    transform: 'rotate(45deg)',
                    opacity: opacity,
                    boxShadow: cell.level > 0.7 ? '0 0 6px rgba(255, 255, 255, 0.8)' : 'none',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '3px',
                    height: '10px',
                    background: 'var(--chrome-sheen)',
                    opacity: opacity,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Hex Truncated Snippet & Copy Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-silver)',
            letterSpacing: '0.05em',
          }}
        >
          {pubkey ? `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}` : '0x00...00'}
        </span>

        {showCopy && (
          <button
            onClick={copyToClipboard}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.15em',
              transition: 'color var(--transition-fast)',
            }}
            title="Copy Public Key"
          >
            <IconCopyBlade size={12} />
            <span>COPY</span>
          </button>
        )}
      </div>
    </div>
  );
};
