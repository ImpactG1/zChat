import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { useRelayStore } from '@/stores/useRelayStore';
import { Shield, Layers, Radio, KeyRound } from 'lucide-react';

interface HeaderProps {
  onOpenRelays: () => void;
  onOpenSeed: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRelays, onOpenSeed }) => {
  const { identity } = useAuthStore();
  const { isEnabled, toggleOverlay, isClickThrough } = useOverlayStore();
  const { relays } = useRelayStore();

  const connectedCount = relays.filter((r) => r.status === 'connected').length;

  return (
    <header className="glass-panel" style={{ margin: '8px 12px 4px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      {/* Brand & User Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', boxShadow: '0 0 14px var(--accent-cyan-glow)' }}>
          <Shield size={20} color="#080a0f" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px', background: 'linear-gradient(90deg, #fff, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              zChat
            </span>
            <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.15)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.3)', fontFamily: 'var(--font-mono)' }}>
              HUD
            </span>
          </div>
          {identity && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{identity.displayName}</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{identity.tag}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Relay Indicator */}
        <button
          onClick={onOpenRelays}
          className="cyber-button"
          style={{ padding: '6px 10px', fontSize: '12px', height: '34px' }}
          title="Relay Pool Status"
        >
          <Radio size={14} color={connectedCount > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{connectedCount}/{relays.length}</span>
        </button>

        {/* Overlay HUD Toggle */}
        <button
          onClick={toggleOverlay}
          className="cyber-button"
          style={{
            padding: '6px 10px',
            fontSize: '12px',
            height: '34px',
            borderColor: isEnabled ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            background: isEnabled ? 'rgba(0, 240, 255, 0.25)' : undefined,
            boxShadow: isEnabled ? '0 0 12px var(--accent-cyan-glow)' : undefined,
          }}
          title={isEnabled ? 'Overlay Enabled (Click to toggle)' : 'Enable Chat Heads Overlay'}
        >
          <Layers size={14} color={isEnabled ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
          <span>{isEnabled ? (isClickThrough ? 'GHOST' : 'HUD ON') : 'HUD'}</span>
        </button>

        {/* Seed Backup */}
        <button
          onClick={onOpenSeed}
          className="cyber-button"
          style={{ padding: '6px 8px', height: '34px' }}
          title="Backup 12-Word Seed Phrase"
        >
          <KeyRound size={15} color="var(--accent-purple)" />
        </button>
      </div>
    </header>
  );
};
