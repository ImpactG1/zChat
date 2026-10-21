import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { useRelayStore } from '@/stores/useRelayStore';
import { useP2PStore } from '@/stores/useP2PStore';
import { OverlayBridge } from '@/bridge/overlayBridge';
import { EmblemLogo } from '@/components/common/EmblemLogo';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import {
  IconRelayTower,
  IconKeyVault,
  IconSettingsGears,
  IconBubbleOverlay,
  IconClose,
  IconSearchLoupe,
  IconCopyBlade,
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
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [copiedPubkey, setCopiedPubkey] = useState(false);

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleCopyPubkey = () => {
    if (!identity?.pubkey) return;
    navigator.clipboard.writeText(identity.pubkey);
    SoundEngine.playBladeTick();
    setCopiedPubkey(true);
    setTimeout(() => setCopiedPubkey(false), 2000);
  };

  return (
    <>
      <header
        style={{
          margin: isMobile ? '4px 6px' : '6px 12px 4px',
          padding: isMobile ? '6px 10px' : '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--void-1)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          zIndex: 50,
          boxSizing: 'border-box',
          maxWidth: '100%',
          overflow: 'hidden',
          // @ts-ignore
          WebkitAppRegion: isDesktop ? 'drag' : 'no-drag',
        }}
      >
        {/* Brand & User Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', minWidth: 0 }}>
          <EmblemLogo size={isMobile ? 28 : 36} />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: isMobile ? '13px' : '15px',
                  letterSpacing: isMobile ? '0.18em' : '0.24em',
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #D4D8DD 60%, #8A929B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                ZENYTH
              </span>
              {!isMobile && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '10px' }}>✦</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '9px',
                      letterSpacing: '0.28em',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    DUELING GROUNDS
                  </span>
                </>
              )}
            </div>

            {identity && (
              <div
                style={{
                  fontSize: isMobile ? '10px' : '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    background: 'var(--status-online)',
                    transform: 'rotate(45deg)',
                    boxShadow: '0 0 6px var(--status-online)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-silver)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {identity.displayName}
                </span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: isMobile ? '9px' : '10px' }}>
                  {identity.tag}
                </span>
                {roomState.code && (
                  <span
                    style={{
                      fontSize: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {isMobile ? `⚡${roomState.code}` : `ROOM: ${roomState.code}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Desktop Mode */}
        {!isMobile ? (
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
        ) : (
          /* Action Buttons: Mobile Mode (Compact + Tactical Grid Trigger) */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            {/* Relay Status Chip */}
            <button
              onClick={() => {
                SoundEngine.playBladeTick();
                onOpenRelays();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 7px',
                height: '28px',
                background: 'var(--void-2)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: 'var(--text-silver)',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
              title="Relays"
            >
              <IconRelayTower size={11} color={connectedCount > 0 ? 'var(--status-relay-ok)' : 'var(--status-error)'} />
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
                gap: '4px',
                padding: '3px 8px',
                height: '28px',
                background: isEnabled ? 'rgba(255, 255, 255, 0.18)' : 'var(--void-2)',
                border: `1px solid ${isEnabled ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
                color: '#ffffff',
                fontSize: '9px',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
              title="Toggle HUD Overlay"
            >
              <IconBubbleOverlay size={12} />
              <span>{isEnabled ? 'HUD' : 'OVERLAY'}</span>
            </button>

            {/* Tactical Drawer Menu Button */}
            <button
              onClick={() => {
                SoundEngine.playBladeTick();
                setShowMobileDrawer(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '28px',
                background: 'var(--void-2)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
              title="Tactical Matrix Menu"
            >
              <IconSettingsGears size={14} />
            </button>
          </div>
        )}
      </header>

      {/* Mobile Tactical Matrix Drawer */}
      {showMobileDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowMobileDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '310px',
              maxWidth: '85vw',
              height: '100%',
              background: 'var(--void-1)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.95)',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EmblemLogo size={24} />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    letterSpacing: '0.2em',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  TACTICAL MATRIX
                </span>
              </div>
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setShowMobileDrawer(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-silver)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <IconClose size={16} />
              </button>
            </div>

            {/* User Profile Card */}
            {identity && (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      background: 'var(--void-3)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '12px',
                      color: '#ffffff',
                      fontWeight: 800,
                    }}
                  >
                    {identity.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: '#ffffff', fontWeight: 700, letterSpacing: '0.1em' }}>
                      {identity.displayName}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {identity.tag}
                    </div>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '8px', padding: '6px', background: 'var(--void-0)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {identity.pubkey}
                </div>

                <ChromeButton
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPubkey}
                  icon={<IconCopyBlade size={11} />}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '10px' }}
                >
                  {copiedPubkey ? 'PUBKEY COPIED' : 'COPY IDENTITY KEY'}
                </ChromeButton>
              </div>
            )}

            {/* Quick Actions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="tracked-micro" style={{ fontSize: '9px' }}>COVENANT CONTROLS</span>

              {/* Sound Audio Toggle */}
              <button
                onClick={() => {
                  const next = !soundMuted;
                  setSoundMuted(next);
                  SoundEngine.setMuted(next);
                  if (!next) SoundEngine.playBladeTick();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <span>BLADE AUDIO FX</span>
                <span style={{ color: soundMuted ? 'var(--text-muted)' : 'var(--status-online)', fontWeight: 700 }}>
                  {soundMuted ? 'MUTED' : 'ACTIVE'}
                </span>
              </button>

              {/* Command Palette */}
              <button
                onClick={() => {
                  setShowMobileDrawer(false);
                  SoundEngine.playBladeTick();
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <IconSearchLoupe size={14} color="var(--text-silver)" />
                <span>COMMAND MATRIX (CTRL+K)</span>
              </button>

              {/* Runes Recovery Vault */}
              <button
                onClick={() => {
                  setShowMobileDrawer(false);
                  SoundEngine.playBladeTick();
                  onOpenSeed();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <IconKeyVault size={14} color="var(--text-silver)" />
                <span>RECALL RUNES (SEED VAULT)</span>
              </button>

              {/* Themes & Visuals */}
              <button
                onClick={() => {
                  setShowMobileDrawer(false);
                  SoundEngine.playBladeTick();
                  onOpenThemes();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <IconSettingsGears size={14} color="var(--text-silver)" />
                <span>TACTICAL THEMES & SETTINGS</span>
              </button>

              {/* Relay Pool */}
              <button
                onClick={() => {
                  setShowMobileDrawer(false);
                  SoundEngine.playBladeTick();
                  onOpenRelays();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconRelayTower size={14} color="var(--status-relay-ok)" />
                  <span>RELAY MESH POOL</span>
                </div>
                <span style={{ color: 'var(--status-relay-ok)' }}>{connectedCount}/{relays.length}</span>
              </button>
            </div>

            {/* P2P Status in Drawer */}
            <div style={{ marginTop: 'auto', padding: '10px', background: 'var(--void-0)', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <div>NETWORK: NIP-17 GIFT WRAP</div>
              <div style={{ color: 'var(--status-online)', marginTop: '2px' }}>
                {roomState.code ? `DIRECT UDP MESH (${roomState.code})` : 'PUBLIC RELAYS ACTIVE'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
