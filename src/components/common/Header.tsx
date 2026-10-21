import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { useRelayStore } from '@/stores/useRelayStore';
import { useP2PStore } from '@/stores/useP2PStore';
import { OverlayBridge } from '@/bridge/overlayBridge';
import { EmblemLogo } from '@/components/common/EmblemLogo';
import {
  IconRelayTower,
  IconKeyVault,
  IconSettingsGears,
  IconBubbleOverlay,
  IconClose,
  IconSearchLoupe,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface HeaderProps {
  onOpenRelays: () => void;
  onOpenSeed: () => void;
  onOpenThemes: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRelays, onOpenSeed, onOpenThemes }) => {
  const { identity } = useAuthStore();
  const { isEnabled, toggleOverlay, isClickThrough } = useOverlayStore();
  const { relays } = useRelayStore();
  const { roomState } = useP2PStore();
  const [isPinned, setIsPinned] = useState(true);
  const [soundMuted, setSoundMuted] = useState(() => SoundEngine.isSoundMuted());

  const isDesktop = OverlayBridge.isDesktop();
  const connectedCount = relays.filter((r) => r.status === 'connected').length;

  const handleMinimize = () => {
    SoundEngine.playBladeTick();
    window.electronAPI?.minimize();
  };

  const handleClose = () => {
    SoundEngine.playBladeTick();
    window.electronAPI?.close();
  };

  const handleTogglePin = () => {
    SoundEngine.playBladeTick();
    const next = !isPinned;
    setIsPinned(next);
    window.electronAPI?.setAlwaysOnTop(next);
  };

  return (
    <header
      style={{
        margin: '6px 12px 4px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--void-1)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
        zIndex: 50,
        // @ts-ignore
        WebkitAppRegion: isDesktop ? 'drag' : 'no-drag',
      }}
    >
      {/* Brand & User Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <EmblemLogo size={38} glow shimmer />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '15px',
                letterSpacing: '0.24em',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #D4D8DD 60%, #8A929B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase',
              }}
            >
              ZENYTH
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '10px' }}>✦</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px',
                letterSpacing: '0.28em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              DUELING GROUNDS
            </span>
          </div>

          {identity && (
            <div
              style={{
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '1px',
              }}
            >
              <div
                style={{
                  width: '5px',
                  height: '5px',
                  background: 'var(--status-online)',
                  transform: 'rotate(45deg)',
                  boxShadow: '0 0 6px var(--status-online)',
                }}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-silver)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {identity.displayName}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                {identity.tag}
              </span>
              {roomState.code && (
                <span
                  style={{
                    fontSize: '9px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    padding: '1px 5px',
                    borderRadius: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                  }}
                >
                  SANCTUM: {roomState.code}
                </span>
              )}
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
        {/* Live P2P UDP Latency Indicator */}
        {roomState.code && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              height: '32px',
              borderRadius: '2px',
              background: 'var(--void-2)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-silver)',
            }}
            title="Mesh Latency"
          >
            <span>⚡ {roomState.averagePing > 0 ? `${roomState.averagePing}ms` : '<20ms'}</span>
          </div>
        )}

        {/* Command Palette Trigger */}
        <button
          onClick={() => {
            SoundEngine.playBladeTick();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            height: '32px',
            background: 'var(--void-2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: 'var(--text-silver)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            cursor: 'pointer',
            borderRadius: '2px',
            transition: 'border-color var(--transition-fast)',
          }}
          title="Open Command Palette (Ctrl+K)"
        >
          <IconSearchLoupe size={13} color="var(--text-silver)" />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CTRL+K</span>
        </button>

        {/* Relay Indicator */}
        <button
          onClick={() => {
            SoundEngine.playBladeTick();
            onOpenRelays();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            height: '32px',
            background: 'var(--void-2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: 'var(--text-silver)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            borderRadius: '2px',
            transition: 'border-color var(--transition-fast)',
          }}
          title="Relay Pool Status"
        >
          <IconRelayTower size={13} color={connectedCount > 0 ? 'var(--status-relay-ok)' : 'var(--status-error)'} />
          <span>{connectedCount}/{relays.length}</span>
        </button>

        {/* Overlay HUD Toggle */}
        <button
          onClick={() => {
            SoundEngine.playBladeTick();
            toggleOverlay();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            height: '32px',
            background: isEnabled ? 'rgba(255, 255, 255, 0.18)' : 'var(--void-2)',
            border: `1px solid ${isEnabled ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
            color: '#ffffff',
            fontSize: '10px',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.15em',
            cursor: 'pointer',
            borderRadius: '2px',
            boxShadow: isEnabled ? '0 0 12px rgba(255, 255, 255, 0.2)' : 'none',
          }}
          title={isEnabled ? 'Overlay Active (Click to toggle)' : 'Launch Persistent Floating HUD'}
        >
          <IconBubbleOverlay size={13} />
          <span>{isEnabled ? (isClickThrough ? 'GHOST' : 'HUD ON') : 'OVERLAY'}</span>
        </button>

        {/* Audio / Mute Toggle */}
        <button
          onClick={() => {
            const next = !soundMuted;
            setSoundMuted(next);
            SoundEngine.setMuted(next);
            if (!next) SoundEngine.playBladeTick();
          }}
          style={{
            padding: '4px 8px',
            height: '32px',
            background: 'var(--void-2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: soundMuted ? 'var(--text-muted)' : '#ffffff',
            cursor: 'pointer',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
          }}
          title={soundMuted ? 'Unmute Synthesized Blade Audio' : 'Mute Synthesized Audio'}
        >
          {soundMuted ? 'MUTED' : 'SFX ON'}
        </button>

        {/* Settings & Themes */}
        <button
          onClick={() => {
            SoundEngine.playBladeTick();
            onOpenThemes();
          }}
          style={{
            padding: '6px 8px',
            height: '32px',
            background: 'var(--void-2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: 'var(--text-silver)',
            cursor: 'pointer',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Settings & Visual Themes"
        >
          <IconSettingsGears size={14} />
        </button>

        {/* Seed Vault */}
        <button
          onClick={() => {
            SoundEngine.playBladeTick();
            onOpenSeed();
          }}
          style={{
            padding: '6px 8px',
            height: '32px',
            background: 'var(--void-2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: 'var(--text-silver)',
            cursor: 'pointer',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Recall Runes Vault"
        >
          <IconKeyVault size={14} />
        </button>

        {/* Desktop Frameless Window Controls */}
        {isDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
            <button
              onClick={handleTogglePin}
              style={{
                padding: '4px 8px',
                height: '32px',
                background: isPinned ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                cursor: 'pointer',
                borderRadius: '2px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
              }}
              title={isPinned ? 'Always on Top (Pinned)' : 'Unpinned'}
            >
              {isPinned ? 'PINNED' : 'PIN'}
            </button>
            <button
              onClick={handleMinimize}
              style={{
                padding: '4px 8px',
                height: '32px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-silver)',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
              title="Minimize"
            >
              —
            </button>
            <button
              onClick={handleClose}
              style={{
                padding: '4px 8px',
                height: '32px',
                background: 'transparent',
                border: '1px solid rgba(139, 52, 52, 0.4)',
                color: 'var(--status-error)',
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close"
            >
              <IconClose size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
