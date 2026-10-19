import React from 'react';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { Eye, MousePointer } from 'lucide-react';

export const OverlayHUDBar: React.FC = () => {
  const { isEnabled, opacity, setOpacity, isClickThrough, toggleClickThrough } = useOverlayStore();

  if (!isEnabled) return null;

  return (
    <div
      className="glass-panel-glow"
      style={{
        margin: '4px 12px 6px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '12px',
      }}
    >
      {/* Opacity / Ghost Mode Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <Eye size={15} color="var(--accent-cyan)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap' }}>
          Ghost: {opacity}%
        </span>
        <input
          type="range"
          min="15"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: 'var(--accent-cyan)',
            cursor: 'pointer',
            height: '4px',
          }}
        />
      </div>

      {/* Click-Through Toggle */}
      <button
        onClick={toggleClickThrough}
        className="cyber-button"
        style={{
          padding: '4px 8px',
          fontSize: '11px',
          borderColor: isClickThrough ? 'var(--accent-emerald)' : 'var(--border-subtle)',
          background: isClickThrough ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
        }}
        title="When active, all touches pass through to the game behind this window"
      >
        <MousePointer size={12} color={isClickThrough ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
        <span>{isClickThrough ? 'PASS-THRU' : 'TOUCH ON'}</span>
      </button>
    </div>
  );
};
