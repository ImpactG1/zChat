import React, { useState, useRef, useEffect } from 'react';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { EmblemLogo } from '@/components/common/EmblemLogo';
import { MockService } from '@/services/mockDataService';
import { MessageBubble } from '@/components/design-system/MessageBubble';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import {
  IconGhostMode,
  IconClickThrough,
  IconBladeSend,
  IconClose,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

export type OverlayMode = 'bubble' | 'mini' | 'full';

export const FloatingOverlayHUD: React.FC = () => {
  const {
    isEnabled,
    opacity,
    setOpacity,
    isClickThrough,
    toggleClickThrough,
    toggleOverlay,
  } = useOverlayStore();

  const [mode, setMode] = useState<OverlayMode>('bubble');
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 80) : 320,
    y: 160,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const activeContact = MockService.getContacts()[0]; // Viper#8f3a
  const [messages, setMessages] = useState(() => MockService.getDirectMessages(activeContact.pubkey));
  const [replyText, setReplyText] = useState('');

  // Update messages periodically or when new ones arrive
  useEffect(() => {
    const unsub = MockService.subscribe(() => {
      setMessages(MockService.getDirectMessages(activeContact.pubkey));
    });
    return unsub;
  }, [activeContact.pubkey]);

  if (!isEnabled) return null;

  // Dragging handlers for the floating bubble
  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== 'bubble') return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || mode !== 'bubble') return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 64, dragStartRef.current.posX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 64, dragStartRef.current.posY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Edge snapping logic
    const midX = window.innerWidth / 2;
    const snappedX = position.x < midX ? 16 : window.innerWidth - 70;
    setPosition((prev) => ({ ...prev, x: snappedX }));
  };

  const handleSendQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    SoundEngine.playBladeTick();
    MockService.sendDirectMessage(activeContact.pubkey, replyText.trim());
    setReplyText('');
  };

  const hudOpacityValue = opacity / 100;

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 99999,
        pointerEvents: isClickThrough && mode === 'full' ? 'none' : 'auto',
      }}
    >
      {/* 1. FLOATING BUBBLE MODE */}
      {mode === 'bubble' && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => {
            if (!isDragging) {
              SoundEngine.playBladeTick();
              setMode('mini');
            }
          }}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '56px',
            height: '56px',
            background: 'var(--void-1)',
            border: '1.5px solid rgba(255, 255, 255, 0.45)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.9), 0 0 12px rgba(255, 255, 255, 0.2)',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            cursor: isDragging ? 'grabbing' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            transition: isDragging ? 'none' : 'transform var(--transition-fast)',
          }}
          title="Zenyth HUD Sigil (Click to expand)"
        >
          <EmblemLogo size={42} glow />

          {/* Unread Stack Badge */}
          {activeContact.unreadCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '16px',
                height: '16px',
                background: '#ffffff',
                color: '#000000',
                borderRadius: '2px',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)',
              }}
            >
              {activeContact.unreadCount}
            </div>
          )}
        </div>
      )}

      {/* 2. COMPACT MINI HUD PANEL (340px) */}
      {mode === 'mini' && (
        <div
          className="anim-slice-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '340px',
            background: `rgba(5, 6, 8, ${hudOpacityValue})`,
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            boxShadow: '0 8px 36px rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EmblemLogo size={22} />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                {activeContact.alias.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                {activeContact.tag}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Expand to Full Panel */}
              <button
                onClick={() => setMode('full')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-silver)',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                }}
                title="Expand to Full Panel"
              >
                ⤢ FULL
              </button>

              {/* Minimize to Bubble */}
              <button
                onClick={() => setMode('bubble')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Minimize to Sigil"
              >
                <IconClose size={13} />
              </button>
            </div>
          </div>

          {/* Messages Stream (Last 3) */}
          <div
            style={{
              padding: '12px',
              maxHeight: '220px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {messages.slice(-3).map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '8px 10px',
                  background: msg.senderPubkey === activeContact.pubkey ? 'var(--void-2)' : 'var(--void-3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                  {msg.senderPubkey === activeContact.pubkey ? activeContact.alias : 'You'}
                </div>
                {msg.content}
              </div>
            ))}
          </div>

          {/* Quick Reply Bar */}
          <form
            onSubmit={handleSendQuickReply}
            style={{
              padding: '8px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              gap: '6px',
            }}
          >
            <input
              type="text"
              placeholder="Quick reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--void-0)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '12px',
                padding: '6px 10px',
                borderRadius: '2px',
                outline: 'none',
              }}
            />
            <ChromeButton
              variant="solid"
              size="sm"
              type="submit"
              icon={<IconBladeSend size={12} color="#000" />}
              style={{ minHeight: '32px', padding: '0 10px' }}
            >
              SEND
            </ChromeButton>
          </form>
        </div>
      )}

      {/* 3. FULL OVERLAY PANEL (480px) */}
      {mode === 'full' && (
        <div
          className="anim-slice-in"
          style={{
            position: 'fixed',
            top: '40px',
            bottom: '40px',
            right: '24px',
            width: '480px',
            maxWidth: 'calc(100vw - 32px)',
            background: `rgba(5, 6, 8, ${hudOpacityValue})`,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Full Overlay Top Control HUD */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <EmblemLogo size={28} glow />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    letterSpacing: '0.2em',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  ZENYTH HUD
                </div>
                <div className="tracked-micro" style={{ fontSize: '9px' }}>
                  ALWAYS-ON-TOP DUELING PANEL
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Opacity Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconGhostMode size={13} color="var(--text-silver)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  {opacity}%
                </span>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  style={{ width: '60px', accentColor: '#ffffff', cursor: 'pointer' }}
                />
              </div>

              {/* Click-Through Mode Toggle */}
              <button
                onClick={toggleClickThrough}
                style={{
                  padding: '4px 8px',
                  background: isClickThrough ? 'rgba(82, 128, 104, 0.25)' : 'var(--void-2)',
                  border: `1px solid ${isClickThrough ? 'var(--status-relay-ok)' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: isClickThrough ? 'var(--status-relay-ok)' : 'var(--text-silver)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="When active, touches pass through to game"
              >
                <IconClickThrough size={11} />
                <span>{isClickThrough ? 'PASS-THRU' : 'TOUCH ON'}</span>
              </button>

              {/* Minimize to Mini / Bubble */}
              <button
                onClick={() => setMode('mini')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-silver)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '2px',
                }}
              >
                MINI
              </button>

              <button
                onClick={() => toggleOverlay()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Close Overlay"
              >
                <IconClose size={14} />
              </button>
            </div>
          </div>

          {/* Full Conversation Thread */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                id={msg.id}
                content={msg.content}
                timestamp={msg.timestamp}
                isSelf={msg.senderPubkey !== activeContact.pubkey}
                senderName={msg.senderPubkey === activeContact.pubkey ? activeContact.alias : undefined}
                senderTag={msg.senderPubkey === activeContact.pubkey ? activeContact.tag : undefined}
                status={msg.status}
              />
            ))}
          </div>

          {/* Full Input Bar */}
          <form
            onSubmit={handleSendQuickReply}
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              gap: '8px',
              background: 'var(--void-0)',
            }}
          >
            <input
              type="text"
              placeholder={`Transmit to ${activeContact.alias}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--void-1)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                fontSize: '13px',
                padding: '8px 12px',
                borderRadius: '2px',
                outline: 'none',
              }}
            />
            <ChromeButton
              variant="solid"
              size="md"
              type="submit"
              icon={<IconBladeSend size={13} color="#000" />}
              style={{ height: '38px', minHeight: '38px', padding: '0 14px' }}
            >
              SEAL
            </ChromeButton>
          </form>
        </div>
      )}
    </div>
  );
};
