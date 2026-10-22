import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { sendDirectMessage } from '@/core/nostr/messageSender';
import { Contact, ChatMessage, GroupChat, GroupMessage } from '@/types';
import { useOverlayStore } from '@/stores/useOverlayStore';
import { EmblemLogo } from '@/components/common/EmblemLogo';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import {
  IconGhostMode,
  IconClickThrough,
  IconBladeSend,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

export type OverlayMode = 'minimized' | 'maximized';

export const FloatingOverlayHUD: React.FC = () => {
  const {
    isEnabled,
    opacity,
    setOpacity,
    isClickThrough,
    toggleClickThrough,
    toggleOverlay,
  } = useOverlayStore();

  // 2 Distinct States: Minimized (floating bubble) and Maximized (full HUD)
  const [mode, setMode] = useState<OverlayMode>('maximized');

  // Minimized Bubble Position (Edge-snapping)
  const [bubblePos, setBubblePos] = useState(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 80) : 320,
    y: 160,
  }));
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const bubbleDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Maximized HUD Window Geometry
  const [panelPos, setPanelPos] = useState({ x: 32, y: 56 });
  const [panelSize, setPanelSize] = useState({ width: 380, height: 480 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const panelDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const panelResizeStartRef = useRef({ startX: 0, startY: 0, initW: 0, initH: 0 });

  // Messages Scroll Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamically query latest active contact or group
  const activeContact = useLiveQuery<Contact | undefined>(
    () => db.contacts.orderBy('lastTimestamp').reverse().first()
  );

  const activeGroup = useLiveQuery<GroupChat | undefined>(
    () => db.groups.orderBy('lastTimestamp').reverse().first()
  );

  const isGroupActive = Boolean(
    activeGroup && (!activeContact || (activeGroup.lastTimestamp || 0) > (activeContact.lastTimestamp || 0))
  );

  // Dynamically query messages
  const directMessages = useLiveQuery<ChatMessage[]>(
    async () => {
      if (!activeContact?.pubkey) return [];
      return db.messages.where('conversationId').equals(activeContact.pubkey).sortBy('timestamp');
    },
    [activeContact?.pubkey]
  ) ?? [];

  const groupMessages = useLiveQuery<GroupMessage[]>(
    async () => {
      if (!activeGroup?.id) return [];
      return db.groupMessages.where('groupId').equals(activeGroup.id).sortBy('timestamp');
    },
    [activeGroup?.id]
  ) ?? [];

  const [replyText, setReplyText] = useState('');

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages.length, groupMessages.length]);

  if (!isEnabled) return null;

  // =========================================================================
  // 1. BUBBLE DRAG HANDLERS (MINIMIZED STATE)
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
    const snappedX = bubblePos.x < midX ? 16 : window.innerWidth - 72;
    setBubblePos((prev) => ({ ...prev, x: snappedX }));
  };

  // =========================================================================
  // 2. PANEL DRAG & RESIZE HANDLERS (MAXIMIZED STATE)
  // =========================================================================
  const handlePanelDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    setIsDraggingPanel(true);
    panelDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: panelPos.x,
      initY: panelPos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanelDragMove = (e: React.PointerEvent) => {
    if (!isDraggingPanel) return;
    const dx = e.clientX - panelDragStartRef.current.startX;
    const dy = e.clientY - panelDragStartRef.current.startY;
    const newX = Math.max(0, Math.min(window.innerWidth - 140, panelDragStartRef.current.initX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 70, panelDragStartRef.current.initY + dy));
    setPanelPos({ x: newX, y: newY });
  };

  const handlePanelDragEnd = (e: React.PointerEvent) => {
    if (!isDraggingPanel) return;
    setIsDraggingPanel(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handlePanelResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizingPanel(true);
    panelResizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: panelSize.width,
      initH: panelSize.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanelResizeMove = (e: React.PointerEvent) => {
    if (!isResizingPanel) return;
    const dw = e.clientX - panelResizeStartRef.current.startX;
    const dh = e.clientY - panelResizeStartRef.current.startY;
    const maxW = Math.max(300, window.innerWidth - panelPos.x - 10);
    const maxH = Math.max(260, window.innerHeight - panelPos.y - 10);
    setPanelSize({
      width: Math.max(300, Math.min(maxW, panelResizeStartRef.current.initW + dw)),
      height: Math.max(260, Math.min(maxH, panelResizeStartRef.current.initH + dh)),
    });
  };

  const handlePanelResizeEnd = (e: React.PointerEvent) => {
    if (!isResizingPanel) return;
    setIsResizingPanel(false);
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
  const channelDisplayTitle = isGroupActive
    ? (activeGroup?.name ? `SANCTUM // ${activeGroup.name.toUpperCase()}` : 'SANCTUM SQUAD')
    : (activeContact ? activeContact.alias.toUpperCase() : 'ZENYTH HUD');

  const unreadBadgeCount = (activeContact?.unreadCount || 0) + (activeGroup?.unreadCount || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    >
      {/* ================================================================= */}
      {/* 1. STATE 1: MINIMIZED FLOATING BUBBLE                             */}
      {/* ================================================================= */}
      {mode === 'minimized' && (
        <div
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={handleBubblePointerUp}
          onClick={() => {
            if (!isDraggingBubble) {
              SoundEngine.playBladeTick();
              setMode('maximized');
            }
          }}
          style={{
            position: 'fixed',
            left: `${bubblePos.x}px`,
            top: `${bubblePos.y}px`,
            width: '58px',
            height: '58px',
            background: 'var(--void-1)',
            borderRadius: '50%',
            border: '2px solid #00F0FF',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4), 0 8px 24px rgba(0, 0, 0, 0.85)',
            cursor: isDraggingBubble ? 'grabbing' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            pointerEvents: 'auto',
            transition: isDraggingBubble ? 'none' : 'transform var(--transition-fast)',
          }}
          title="Zenyth HUD Sigil (Click to maximize chat)"
        >
          <EmblemLogo size={42} />

          {/* Unread Stack Badge */}
          {unreadBadgeCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                background: '#F43F5E',
                color: '#ffffff',
                borderRadius: '9px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(244, 63, 94, 0.9)',
              }}
            >
              {unreadBadgeCount > 99 ? '99+' : unreadBadgeCount}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. STATE 2: MAXIMIZED GAMER HUD PANEL                             */}
      {/* ================================================================= */}
      {mode === 'maximized' && (
        <div
          className="anim-slice-in"
          style={{
            position: 'fixed',
            left: `${panelPos.x}px`,
            top: `${panelPos.y}px`,
            width: `${panelSize.width}px`,
            height: `${panelSize.height}px`,
            // GHOST MODE: Only the chat background becomes transparent (0% - 100%)
            background: `rgba(8, 10, 15, ${hudOpacityValue})`,
            backdropFilter: opacity > 15 ? 'blur(16px)' : 'none',
            border: `1.5px solid rgba(0, 240, 255, ${Math.max(0.2, hudOpacityValue)})`,
            borderRadius: '12px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: isClickThrough ? 'none' : 'auto',
          }}
        >
          {/* Tactical Recoverable Touch Pill (Always interactive even in Pass-Through mode) */}
          {isClickThrough && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                SoundEngine.playBladeTick();
                toggleClickThrough();
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '48px',
                background: '#F59E0B',
                color: '#000000',
                border: '1.5px solid #ffffff',
                borderRadius: '14px',
                padding: '4px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 100005,
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.9)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Click here to restore touch control"
            >
              <span>⚡ PASS-THRU</span>
              <span style={{ textDecoration: 'underline' }}>[RESTORE TOUCH]</span>
            </button>
          )}

          {/* Draggable Header (Solid background ensures controls are visible even when opacity is 0%) */}
          <div
            onPointerDown={handlePanelDragStart}
            onPointerMove={handlePanelDragMove}
            onPointerUp={handlePanelDragEnd}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(12, 15, 22, 0.98)',
              cursor: isDraggingPanel ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              pointerEvents: 'auto',
            }}
          >
            {/* Header Sigil + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <EmblemLogo size={22} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    color: '#ffffff',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {channelDisplayTitle}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: '#00F0FF',
                    letterSpacing: '0.08em',
                  }}
                >
                  ● P2P MESH ACTIVE
                </div>
              </div>
            </div>

            {/* Header Controls (All buttons have pointerEvents: 'auto') */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
              {/* Ghost Mode Opacity Slider (0% to 100%) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(20, 25, 35, 0.95)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                }}
                title={`Ghost Mode Transparency: ${opacity}% (0% to 100%) - Only chat background fades!`}
              >
                <IconGhostMode size={12} color="#8892B0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  style={{ width: '48px', accentColor: '#00F0FF', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#ffffff', minWidth: '24px' }}>
                  {opacity}%
                </span>
              </div>

              {/* Pass-Through (Click-Through) Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  SoundEngine.playBladeTick();
                  toggleClickThrough();
                }}
                style={{
                  padding: '4px 8px',
                  background: isClickThrough ? 'rgba(245, 158, 11, 0.25)' : 'rgba(20, 25, 35, 0.95)',
                  border: `1px solid ${isClickThrough ? '#F59E0B' : '#00F0FF'}`,
                  color: isClickThrough ? '#F59E0B' : '#00F0FF',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  pointerEvents: 'auto',
                }}
                title={isClickThrough ? 'Pass-Through active (clicks pass through to game)' : 'Activate Pass-Through (clicks pass to underlying game)'}
              >
                <IconClickThrough size={11} />
                <span>{isClickThrough ? 'PASS-THRU' : 'TOUCH'}</span>
              </button>

              {/* Minimize to Bubble Button ("MIN") */}
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setMode('minimized');
                }}
                style={{
                  background: 'rgba(26, 32, 44, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '4px',
                  fontWeight: 600,
                  pointerEvents: 'auto',
                }}
                title="Minimize to Floating Sigil Bubble"
              >
                MIN
              </button>

              {/* Close Overlay ("✕") */}
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  toggleOverlay();
                }}
                style={{
                  background: 'rgba(38, 20, 24, 0.95)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#F43F5E',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  pointerEvents: 'auto',
                }}
                title="Exit Overlay to Dashboard"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Stream (Scrollable with solid, readable cards) */}
          <div
            style={{
              flex: 1,
              padding: '12px 14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {isGroupActive && groupMessages.length > 0 ? (
              groupMessages.slice(-20).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '8px 12px',
                    background: msg.authorAlias === 'You' ? 'rgba(30, 39, 56, 0.92)' : 'rgba(19, 23, 34, 0.90)',
                    border: `1px solid ${msg.authorAlias === 'You' ? '#00F0FF' : 'rgba(255, 255, 255, 0.18)'}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ffffff',
                    alignSelf: msg.authorAlias === 'You' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  <div style={{ fontSize: '9.5px', color: msg.authorAlias === 'You' ? '#00F0FF' : '#94A3B8', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                    {msg.authorAlias || msg.senderTag || 'Teammate'}
                  </div>
                  {msg.content}
                </div>
              ))
            ) : activeContact && directMessages.length > 0 ? (
              directMessages.slice(-20).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '8px 12px',
                    background: msg.senderPubkey === activeContact.pubkey ? 'rgba(19, 23, 34, 0.90)' : 'rgba(30, 39, 56, 0.92)',
                    border: `1px solid ${msg.senderPubkey === activeContact.pubkey ? 'rgba(255, 255, 255, 0.18)' : '#00F0FF'}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ffffff',
                    alignSelf: msg.senderPubkey === activeContact.pubkey ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  <div style={{ fontSize: '9.5px', color: msg.senderPubkey === activeContact.pubkey ? '#94A3B8' : '#00F0FF', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                    {msg.senderPubkey === activeContact.pubkey ? activeContact.alias : 'You'}
                  </div>
                  {msg.content}
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(12, 15, 22, 0.5)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '4px' }}>
                WAITING FOR SIGNALS // P2P MESH CONNECTED
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Bar (Opaque background so user can type even when window is transparent) */}
          <form
            onSubmit={handleSendQuickReply}
            style={{
              padding: '8px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              gap: '6px',
              background: 'rgba(12, 15, 22, 0.98)',
              pointerEvents: 'auto',
            }}
          >
            <input
              type="text"
              placeholder={activeContact ? 'Quick callout...' : 'Select contact...'}
              value={replyText}
              disabled={!activeContact}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(4, 6, 9, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                fontSize: '12px',
                padding: '7px 10px',
                borderRadius: '4px',
                outline: 'none',
              }}
            />
            <ChromeButton
              variant="solid"
              size="sm"
              type="submit"
              disabled={!activeContact || !replyText.trim()}
              icon={<IconBladeSend size={11} color="#000" />}
              style={{ minHeight: '32px', padding: '0 12px', fontSize: '10px', background: '#00F0FF', color: '#000000', fontWeight: 'bold' }}
            >
              SEND
            </ChromeButton>
          </form>

          {/* Tactical Resize Grip */}
          <div
            onPointerDown={handlePanelResizeStart}
            onPointerMove={handlePanelResizeMove}
            onPointerUp={handlePanelResizeEnd}
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
              background: 'rgba(255, 255, 255, 0.1)',
              borderTopLeftRadius: '4px',
              zIndex: 10,
            }}
            title="Drag to resize HUD window"
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <line x1="7" y1="1" x2="1" y2="7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="7" y1="4" x2="4" y2="7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
