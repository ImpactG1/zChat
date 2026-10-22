import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { sendDirectMessage } from '@/core/nostr/messageSender';
import { Contact, ChatMessage } from '@/types';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { EmblemLogo } from '@/components/common/EmblemLogo';
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

  // Bubble Position (Edge-snapping)
  const [bubblePos, setBubblePos] = useState(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 80) : 320,
    y: 160,
  }));
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const bubbleDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Mini Window Geometry (Starts at Top-Left corner: x: 24, y: 72)
  const [miniPos, setMiniPos] = useState({ x: 24, y: 72 });
  const [miniSize, setMiniSize] = useState({ width: 340, height: 340 });
  const [isDraggingMini, setIsDraggingMini] = useState(false);
  const miniDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });
  const [isResizingMini, setIsResizingMini] = useState(false);
  const miniResizeStartRef = useRef({ startX: 0, startY: 0, initW: 0, initH: 0 });

  // Full Window Geometry (Starts at Top-Left corner: x: 36, y: 64)
  const [fullPos, setFullPos] = useState({ x: 36, y: 64 });
  const [fullSize, setFullSize] = useState({ width: 480, height: 560 });
  const [isDraggingFull, setIsDraggingFull] = useState(false);
  const fullDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });
  const [isResizingFull, setIsResizingFull] = useState(false);
  const fullResizeStartRef = useRef({ startX: 0, startY: 0, initW: 0, initH: 0 });

  // Dynamically query latest active contact
  const activeContact = useLiveQuery<Contact | undefined>(
    () => db.contacts.orderBy('lastTimestamp').reverse().first()
  );

  // Dynamically query messages for active contact
  const messages = useLiveQuery<ChatMessage[]>(
    async () => {
      if (!activeContact?.pubkey) return [];
      return db.messages.where('conversationId').equals(activeContact.pubkey).sortBy('timestamp');
    },
    [activeContact?.pubkey]
  ) ?? [];

  const [replyText, setReplyText] = useState('');

  if (!isEnabled) return null;

  // =========================================================================
  // 1. BUBBLE DRAG HANDLERS
  // =========================================================================
  const handleBubblePointerDown = (e: React.PointerEvent) => {
    setIsDraggingBubble(true);
    bubbleDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: bubblePos.x,
      initY: bubblePos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleBubblePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingBubble) return;
    const dx = e.clientX - bubbleDragStartRef.current.startX;
    const dy = e.clientY - bubbleDragStartRef.current.startY;
    setBubblePos({
      x: Math.max(10, Math.min(window.innerWidth - 64, bubbleDragStartRef.current.initX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 64, bubbleDragStartRef.current.initY + dy)),
    });
  };

  const handleBubblePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingBubble) return;
    setIsDraggingBubble(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const midX = window.innerWidth / 2;
    const snappedX = bubblePos.x < midX ? 16 : window.innerWidth - 70;
    setBubblePos((prev) => ({ ...prev, x: snappedX }));
  };

  // =========================================================================
  // 2. MINI WINDOW DRAG & RESIZE HANDLERS
  // =========================================================================
  const handleMiniDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    setIsDraggingMini(true);
    miniDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: miniPos.x,
      initY: miniPos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMiniDragMove = (e: React.PointerEvent) => {
    if (!isDraggingMini) return;
    const dx = e.clientX - miniDragStartRef.current.startX;
    const dy = e.clientY - miniDragStartRef.current.startY;
    const newX = Math.max(0, Math.min(window.innerWidth - 120, miniDragStartRef.current.initX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, miniDragStartRef.current.initY + dy));
    setMiniPos({ x: newX, y: newY });
  };

  const handleMiniDragEnd = (e: React.PointerEvent) => {
    if (!isDraggingMini) return;
    setIsDraggingMini(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleMiniResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizingMini(true);
    miniResizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: miniSize.width,
      initH: miniSize.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMiniResizeMove = (e: React.PointerEvent) => {
    if (!isResizingMini) return;
    const dw = e.clientX - miniResizeStartRef.current.startX;
    const dh = e.clientY - miniResizeStartRef.current.startY;
    const maxW = Math.max(260, window.innerWidth - miniPos.x - 10);
    const maxH = Math.max(200, window.innerHeight - miniPos.y - 10);
    setMiniSize({
      width: Math.max(260, Math.min(maxW, miniResizeStartRef.current.initW + dw)),
      height: Math.max(200, Math.min(maxH, miniResizeStartRef.current.initH + dh)),
    });
  };

  const handleMiniResizeEnd = (e: React.PointerEvent) => {
    if (!isResizingMini) return;
    setIsResizingMini(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // =========================================================================
  // 3. FULL WINDOW DRAG & RESIZE HANDLERS
  // =========================================================================
  const handleFullDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    setIsDraggingFull(true);
    fullDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: fullPos.x,
      initY: fullPos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleFullDragMove = (e: React.PointerEvent) => {
    if (!isDraggingFull) return;
    const dx = e.clientX - fullDragStartRef.current.startX;
    const dy = e.clientY - fullDragStartRef.current.startY;
    const newX = Math.max(0, Math.min(window.innerWidth - 160, fullDragStartRef.current.initX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, fullDragStartRef.current.initY + dy));
    setFullPos({ x: newX, y: newY });
  };

  const handleFullDragEnd = (e: React.PointerEvent) => {
    if (!isDraggingFull) return;
    setIsDraggingFull(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleFullResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizingFull(true);
    fullResizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: fullSize.width,
      initH: fullSize.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleFullResizeMove = (e: React.PointerEvent) => {
    if (!isResizingFull) return;
    const dw = e.clientX - fullResizeStartRef.current.startX;
    const dh = e.clientY - fullResizeStartRef.current.startY;
    const maxW = Math.max(340, window.innerWidth - fullPos.x - 10);
    const maxH = Math.max(300, window.innerHeight - fullPos.y - 10);
    setFullSize({
      width: Math.max(340, Math.min(maxW, fullResizeStartRef.current.initW + dw)),
      height: Math.max(300, Math.min(maxH, fullResizeStartRef.current.initH + dh)),
    });
  };

  const handleFullResizeEnd = (e: React.PointerEvent) => {
    if (!isResizingFull) return;
    setIsResizingFull(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeContact) return;
    SoundEngine.playBladeTick();
    const text = replyText.trim();
    setReplyText('');
    try {
      await sendDirectMessage(activeContact.pubkey, text);
    } catch (err) {
      console.error('Failed to send overlay reply:', err);
    }
  };

  const hudOpacityValue = opacity / 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    >
      {/* 1. FLOATING BUBBLE MODE */}
      {mode === 'bubble' && (
        <div
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={handleBubblePointerUp}
          onClick={() => {
            if (!isDraggingBubble) {
              SoundEngine.playBladeTick();
              setMode('mini');
            }
          }}
          style={{
            position: 'fixed',
            left: `${bubblePos.x}px`,
            top: `${bubblePos.y}px`,
            width: '56px',
            height: '56px',
            background: 'var(--void-1)',
            border: '1.5px solid rgba(255, 255, 255, 0.45)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            cursor: isDraggingBubble ? 'grabbing' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            pointerEvents: 'auto',
            transition: isDraggingBubble ? 'none' : 'transform var(--transition-fast)',
          }}
          title="Zenyth HUD Sigil (Click to open chat in top-left)"
        >
          <EmblemLogo size={42} />

          {/* Unread Stack Badge */}
          {activeContact && activeContact.unreadCount > 0 && (
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

      {/* 2. COMPACT MINI HUD PANEL (Moveable + Resizable + Transparency to 0%) */}
      {mode === 'mini' && (
        <div
          className="anim-slice-in"
          style={{
            position: 'fixed',
            left: `${miniPos.x}px`,
            top: `${miniPos.y}px`,
            width: `${miniSize.width}px`,
            height: `${miniSize.height}px`,
            background: `rgba(5, 6, 8, ${hudOpacityValue})`,
            backdropFilter: opacity > 0 ? 'blur(16px)' : 'none',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            boxShadow: '0 8px 36px rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: isClickThrough ? 'none' : 'auto',
          }}
        >
          {/* Draggable Header (Solid background ensures controls are visible even when opacity is 0%) */}
          <div
            onPointerDown={handleMiniDragStart}
            onPointerMove={handleMiniDragMove}
            onPointerUp={handleMiniDragEnd}
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(12, 15, 20, 0.95)',
              cursor: isDraggingMini ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <EmblemLogo size={20} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    color: '#ffffff',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activeContact ? activeContact.alias.toUpperCase() : 'NO CHANNEL'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
              {/* Opacity Slider in Mini Mode */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                title={`Transparency: ${opacity}% (0% to 100%)`}
              >
                <IconGhostMode size={11} color="var(--text-silver)" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  style={{ width: '42px', accentColor: '#ffffff', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#ffffff' }}>
                  {opacity}%
                </span>
              </div>

              {/* Expand to Full Panel */}
              <button
                onClick={() => setMode('full')}
                style={{
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-silver)',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '2px',
                }}
                title="Expand to Full Panel"
              >
                FULL
              </button>

              {/* Minimize to Bubble */}
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setMode('bubble');
                }}
                style={{
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-silver)',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '2px',
                }}
                title="Minimize to Floating Sigil"
              >
                BUBBLE
              </button>

              {/* Exit Overlay to Dashboard */}
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  toggleOverlay();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Exit Overlay to Dashboard"
              >
                <IconClose size={13} color="var(--status-error)" />
              </button>
            </div>
          </div>

          {/* Messages Stream (Last 3) */}
          <div
            style={{
              flex: 1,
              padding: '10px 12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {activeContact && messages.length > 0 ? (
              messages.slice(-3).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '8px 10px',
                    background: msg.senderPubkey === activeContact.pubkey ? 'rgba(20, 24, 32, 0.88)' : 'rgba(32, 38, 48, 0.92)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '2px',
                    fontSize: '12px',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                    {msg.senderPubkey === activeContact.pubkey ? activeContact.alias : 'You'}
                  </div>
                  {msg.content}
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-silver)', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(12, 14, 18, 0.6)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                NO RECENT SIGNALS
              </div>
            )}
          </div>

          {/* Quick Reply Bar (Opaque background so user can type even when window is transparent) */}
          <form
            onSubmit={handleSendQuickReply}
            style={{
              padding: '8px 10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.14)',
              display: 'flex',
              gap: '6px',
              background: 'rgba(12, 15, 20, 0.95)',
              pointerEvents: 'auto',
            }}
          >
            <input
              type="text"
              placeholder={activeContact ? 'Quick reply...' : 'Select contact...'}
              value={replyText}
              disabled={!activeContact}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--void-0)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
              disabled={!activeContact || !replyText.trim()}
              icon={<IconBladeSend size={11} color="#000" />}
              style={{ minHeight: '30px', padding: '0 10px', fontSize: '10px' }}
            >
              SEND
            </ChromeButton>
          </form>

          {/* Tactical Diagonal Resize Grip */}
          <div
            onPointerDown={handleMiniResizeStart}
            onPointerMove={handleMiniResizeMove}
            onPointerUp={handleMiniResizeEnd}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '16px',
              height: '16px',
              cursor: 'nwse-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none',
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.08)',
              borderTopLeftRadius: '3px',
              zIndex: 10,
            }}
            title="Drag to resize mini window"
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <line x1="7" y1="1" x2="1" y2="7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="7" y1="4" x2="4" y2="7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. FULL OVERLAY PANEL (Moveable + Resizable + Transparency to 0% + Recoverable Touch) */}
      {mode === 'full' && (
        <div
          className="anim-slice-in"
          style={{
            position: 'fixed',
            left: `${fullPos.x}px`,
            top: `${fullPos.y}px`,
            width: `${fullSize.width}px`,
            height: `${fullSize.height}px`,
            background: `rgba(5, 6, 8, ${hudOpacityValue})`,
            backdropFilter: opacity > 0 ? 'blur(20px)' : 'none',
            border: '1px solid rgba(255, 255, 255, 0.32)',
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: isClickThrough ? 'none' : 'auto',
          }}
        >
          {/* Floating Recoverable Touch Button (Always interactive even in pass-thru mode) */}
          {isClickThrough && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                SoundEngine.playBladeTick();
                toggleClickThrough();
              }}
              style={{
                position: 'absolute',
                top: '6px',
                right: '48px',
                background: 'rgba(245, 158, 11, 0.95)',
                color: '#000000',
                border: '1px solid #ffffff',
                borderRadius: '2px',
                padding: '4px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 100001,
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.9)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Click here to restore touch control"
            >
              <span>⚡ PASS-THRU ON</span>
              <span style={{ textDecoration: 'underline' }}>[RESTORE TOUCH]</span>
            </button>
          )}

          {/* Draggable Header (Solid background ensures controls are visible even when opacity is 0%) */}
          <div
            onPointerDown={handleFullDragStart}
            onPointerMove={handleFullDragMove}
            onPointerUp={handleFullDragEnd}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(12, 15, 20, 0.95)',
              cursor: isDraggingFull ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <EmblemLogo size={26} />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    letterSpacing: '0.18em',
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

            {/* Controls (All buttons have pointerEvents: 'auto' so they can be clicked even in touch-through) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
              {/* Opacity Slider (0% to 100%) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                title={`Transparency: ${opacity}% (0% to 100%)`}
              >
                <IconGhostMode size={13} color="var(--text-silver)" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  style={{ width: '56px', accentColor: '#ffffff', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#ffffff' }}>
                  {opacity}%
                </span>
              </div>

              {/* Click-Through Mode Toggle (Always touchable) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  SoundEngine.playBladeTick();
                  toggleClickThrough();
                }}
                style={{
                  padding: '4px 8px',
                  background: isClickThrough ? 'rgba(245, 158, 11, 0.3)' : 'var(--void-2)',
                  border: `1px solid ${isClickThrough ? 'var(--status-warning)' : 'rgba(255, 255, 255, 0.22)'}`,
                  color: isClickThrough ? 'var(--status-warning)' : 'var(--text-silver)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  pointerEvents: 'auto',
                }}
                title={isClickThrough ? 'Click to restore normal touches' : 'When active, clicks pass through window to underlying game'}
              >
                <IconClickThrough size={11} />
                <span>{isClickThrough ? 'PASS-THRU' : 'TOUCH ON'}</span>
              </button>

              {/* Minimize to Mini */}
              <button
                onClick={() => setMode('mini')}
                style={{
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-silver)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '2px',
                  pointerEvents: 'auto',
                }}
              >
                MINI
              </button>

              {/* Close Overlay */}
              <button
                onClick={() => toggleOverlay()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  pointerEvents: 'auto',
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
            {activeContact && messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} style={{ background: 'rgba(16, 20, 26, 0.85)', borderRadius: '2px', padding: '2px' }}>
                  <MessageBubble
                    id={msg.id}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    isSelf={msg.senderPubkey !== activeContact.pubkey}
                    senderName={msg.senderPubkey === activeContact.pubkey ? activeContact.alias : undefined}
                    senderTag={msg.senderPubkey === activeContact.pubkey ? activeContact.tag : undefined}
                    status={msg.status}
                  />
                </div>
              ))
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-silver)', fontSize: '12px', fontFamily: 'var(--font-mono)', background: 'rgba(12, 14, 18, 0.5)' }}>
                NO MESSAGES YET
              </div>
            )}
          </div>

          {/* Full Input Bar (Opaque background so user can type even when window is transparent) */}
          <form
            onSubmit={handleSendQuickReply}
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(12, 15, 20, 0.95)',
              pointerEvents: 'auto',
            }}
          >
            <input
              type="text"
              placeholder={activeContact ? `Message ${activeContact.alias}...` : 'Select or start a private chat first...'}
              value={replyText}
              disabled={!activeContact}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--void-1)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
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
              disabled={!activeContact || !replyText.trim()}
              icon={<IconBladeSend size={13} color="#000" />}
              style={{ height: '38px', minHeight: '38px', padding: '0 14px' }}
            >
              SEND
            </ChromeButton>
          </form>

          {/* Tactical Diagonal Resize Grip */}
          <div
            onPointerDown={handleFullResizeStart}
            onPointerMove={handleFullResizeMove}
            onPointerUp={handleFullResizeEnd}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '18px',
              height: '18px',
              cursor: 'nwse-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none',
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.08)',
              borderTopLeftRadius: '3px',
              zIndex: 10,
            }}
            title="Drag to resize full panel"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="9" y1="1" x2="1" y2="9" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="9" y1="5" x2="5" y2="9" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
