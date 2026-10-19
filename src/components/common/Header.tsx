import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { useRelayStore } from '@/stores/useRelayStore';
import { OverlayBridge } from '@/bridge/overlayBridge';
import { Layers, Radio, KeyRound, Palette, Minus, X, Pin, PinOff } from 'lucide-react';
import logoImg from '@/assets/logo.png';

interface HeaderProps {
  onOpenRelays: () => void;
  onOpenSeed: () => void;
  onOpenThemes: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRelays, onOpenSeed, onOpenThemes }) => {
  const { identity } = useAuthStore();
  const { isEnabled, toggleOverlay, isClickThrough } = useOverlayStore();
  const { relays } = useRelayStore();
  const [isPinned, setIsPinned] = useState(true);

  const isDesktop = OverlayBridge.isDesktop();
  const connectedCount = relays.filter((r) => r.status === 'connected').length;

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const handleTogglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    window.electronAPI?.setAlwaysOnTop(next);
  };

  return (
    <header
      className="glass-panel"
      style={{
        margin: '8px 12px 4px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        // @ts-ignore
        WebkitAppRegion: isDesktop ? 'drag' : 'no-drag',
      }}
    >
      {/* Brand & User Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1.5px solid var(--border-glow)',
            boxShadow: '0 0 16px var(--accent-cyan-glow)',
            background: '#04060a',
          }}
        >
          <img
            src={logoImg}
            alt="zChat Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '0.5px',
                background: 'linear-gradient(90deg, #fff, var(--accent-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              zChat
            </span>
            <span
              style={{
                fontSize: '10px',
                background: 'rgba(0, 240, 255, 0.15)',
                color: 'var(--accent-cyan)',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isDesktop ? 'DESKTOP' : 'HUD'}
            </span>
          </div>
          {identity && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{identity.displayName}</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                {identity.tag}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          // @ts-ignore
          WebkitAppRegion: 'no-drag',
        }}
      >
        {/* Relay Indicator */}
        <button
          onClick={onOpenRelays}
          className="cyber-button"
          style={{ padding: '6px 10px', fontSize: '12px', height: '34px' }}
          title="Relay Pool Status"
        >
          <Radio size={14} color={connectedCount > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {connectedCount}/{relays.length}
          </span>
        </button>

        {/* Overlay HUD Toggle (Mobile/Web) */}
        {!isDesktop && (
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
        )}

        {/* Themes & Backup */}
        <button
          onClick={onOpenThemes}
          className="cyber-button"
          style={{ padding: '6px 8px', height: '34px' }}
          title="HUD Visual Themes & Backup"
        >
          <Palette size={15} color="var(--accent-cyan)" />
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

        {/* Desktop Frameless Window Controls */}
        {isDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
            <button
              onClick={handleTogglePin}
              className="cyber-button"
              style={{
                padding: '6px 8px',
                height: '34px',
                background: isPinned ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                borderColor: isPinned ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              }}
              title={isPinned ? 'Always on Top (Pinned)' : 'Unpinned'}
            >
              {isPinned ? <Pin size={14} color="var(--accent-cyan)" /> : <PinOff size={14} color="var(--text-muted)" />}
            </button>
            <button
              onClick={handleMinimize}
              className="cyber-button"
              style={{ padding: '6px 8px', height: '34px', background: 'transparent' }}
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={handleClose}
              className="cyber-button"
              style={{ padding: '6px 8px', height: '34px', background: 'transparent', color: 'var(--accent-rose)' }}
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
