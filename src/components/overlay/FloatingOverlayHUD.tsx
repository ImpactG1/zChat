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

export type OverlayWindowMode = 'minimized' | 'maximized';

export const FloatingOverlayHUD: React.FC = () => {
  const {
    isEnabled,
    opacity,
    setOpacity,
    isClickThrough,
    toggleClickThrough,
    activeConversationId,
    setActiveConversation,
  } = useOverlayStore();

  // Bubble form vs Window form (clicking "✕" converts window back to Bubble form)
  const [isBubbleForm, setIsBubbleForm] = useState(false);

  // 2 Window Modes: Minimized (scaled-down chat-only) and Maximized (larger with chat switcher)
  const [windowMode, setWindowMode] = useState<OverlayWindowMode>('minimized');

  // Bubble Position (Edge-snapping)
  const [bubblePos, setBubblePos] = useState(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 80) : 320,
    y: 160,
  }));
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const bubbleDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Window Geometry
  // Minimized size: 340px x 360px
  // Maximized size: 480px x 540px
  const [panelPos, setPanelPos] = useState({ x: 32, y: 56 });
  const [maximizedSize, setMaximizedSize] = useState({ width: 480, height: 540 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const panelDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const panelResizeStartRef = useRef({ startX: 0, startY: 0, initW: 0, initH: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live queries for contacts and groups
  const allContacts = useLiveQuery<Contact[]>(() => db.contacts.orderBy('lastTimestamp').reverse().toArray()) ?? [];
  const allGroups = useLiveQuery<GroupChat[]>(() => db.groups.orderBy('lastTimestamp').reverse().toArray()) ?? [];

  // Determine unified conversation list
  const conversationList = [
    ...allGroups.map((g) => ({
      pubkey: g.id,
      alias: g.name || 'Sanctum Squad',
      unreadCount: g.unreadCount || 0,
      lastTimestamp: g.lastTimestamp || 0,
      isGroup: true,
    })),
    ...allContacts.map((c) => ({
      pubkey: c.pubkey,
      alias: c.alias || `User#${c.pubkey.slice(0, 4)}`,
      unreadCount: c.unreadCount || 0,
      lastTimestamp: c.lastTimestamp || 0,
      isGroup: false,
    })),
  ].sort((a, b) => b.lastTimestamp - a.lastTimestamp);

  // Determine active conversation
  const activeItem = conversationList.find((c) => c.pubkey === activeConversationId) || conversationList[0];
  const activePubkey = activeItem?.pubkey;
  const isGroupActive = Boolean(activeItem?.isGroup);

  // Dynamically query messages for active item
  const directMessages = useLiveQuery<ChatMessage[]>(
    async () => {
      if (!activePubkey || isGroupActive) return [];
      return db.messages.where('conversationId').equals(activePubkey).sortBy('timestamp');
    },
    [activePubkey, isGroupActive]
  ) ?? [];

  const groupMessages = useLiveQuery<GroupMessage[]>(
    async () => {
      if (!activePubkey || !isGroupActive) return [];
      return db.groupMessages.where('groupId').equals(activePubkey).sortBy('timestamp');
    },
    [activePubkey, isGroupActive]
  ) ?? [];

  const [replyText, setReplyText] = useState('');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages.length, groupMessages.length, activePubkey]);

  if (!isEnabled) return null;

  // =========================================================================
  // 1. BUBBLE DRAG & CLICK HANDLERS
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
  // 2. PANEL DRAG & RESIZE HANDLERS
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
      initW: maximizedSize.width,
      initH: maximizedSize.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanelResizeMove = (e: React.PointerEvent) => {
    if (!isResizingPanel) return;
    const dw = e.clientX - panelResizeStartRef.current.startX;
    const dh = e.clientY - panelResizeStartRef.current.startY;
    const maxW = Math.max(340, window.innerWidth - panelPos.x - 10);
    const maxH = Math.max(300, window.innerHeight - panelPos.y - 10);
    setMaximizedSize({
      width: Math.max(340, Math.min(maxW, panelResizeStartRef.current.initW + dw)),
      height: Math.max(300, Math.min(maxH, panelResizeStartRef.current.initH + dh)),
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
    if (!replyText.trim() || !activePubkey) return;
    SoundEngine.playBladeTick();
    const text = replyText.trim();
    setReplyText('');
    try {
      if (!isGroupActive) {
        await sendDirectMessage(activePubkey, text);
      }
    } catch (err) {
      console.error('Failed to send overlay reply:', err);
    }
  };

  const hudOpacityValue = opacity / 100;
  const totalUnreadCount = conversationList.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const activeTitle = activeItem ? activeItem.alias.toUpperCase() : 'ZENYTH';

  // Dimensions based on mode
  const currentWidth = windowMode === 'maximized' ? maximizedSize.width : 340;
  const currentHeight = windowMode === 'maximized' ? maximizedSize.height : 360;

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
      {/* 1. BUBBLE FORM (When collapsed)                                   */}
      {/* ================================================================= */}
      {isBubbleForm && (
        <div
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={handleBubblePointerUp}
          onClick={() => {
            if (!isDraggingBubble) {
              SoundEngine.playBladeTick();
              setIsBubbleForm(false);
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
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            cursor: isDraggingBubble ? 'grabbing' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            pointerEvents: 'auto',
            transition: isDraggingBubble ? 'none' : 'transform var(--transition-fast)',
          }}
          title="Zenyth HUD Sigil (Click to open chat)"
        >
          <EmblemLogo size={42} />

          {/* Unread Stack Badge */}
          {totalUnreadCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '16px',
                height: '16px',
                padding: '0 3px',
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
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. WINDOW FORM (Void Aesthetics)                                  */}
      {/* Mode 1: MINIMIZED (Scaled-down chat only)                         */}
      {/* Mode 2: MAXIMIZED (Maximized window with chat switcher)           */}
      {/* Clicking "✕" converts back to Bubble form                         */}
      {/* ================================================================= */}
      {!isBubbleForm && (
        <div
          className="anim-slice-in"
          style={{
            position: 'fixed',
            left: `${panelPos.x}px`,
            top: `${panelPos.y}px`,
            width: `${currentWidth}px`,
            height: `${currentHeight}px`,
            // GHOST MODE: Only the chat background becomes transparent (0% - 100%)
            background: `rgba(5, 6, 8, ${hudOpacityValue})`,
            backdropFilter: opacity > 0 ? 'blur(16px)' : 'none',
            border: '1px solid rgba(255, 255, 255, 0.28)',
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: isClickThrough ? 'none' : 'auto',
            transition: isDraggingPanel || isResizingPanel ? 'none' : 'width 0.2s ease, height 0.2s ease',
          }}
        >
          {/* Tactical Recoverable Touch Pill (Always interactive in pass-thru mode) */}
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
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(11, 13, 17, 0.98)',
              cursor: isDraggingPanel ? 'grabbing' : 'grab',
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
                    fontSize: '11.5px',
                    letterSpacing: '0.12em',
                    color: '#ffffff',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activeTitle}
                </div>
              </div>
            </div>

            {/* Header Controls (All buttons have pointerEvents: 'auto') */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', pointerEvents: 'auto' }}>
              {/* Opacity Slider (0% to 100%) */}
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
                title={`Ghost Mode Transparency: ${opacity}% (0% to 100%) - Only chat background fades!`}
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

              {/* Pass-Through (Click-Through) Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  SoundEngine.playBladeTick();
                  toggleClickThrough();
                }}
                style={{
                  padding: '3px 6px',
                  background: isClickThrough ? 'rgba(245, 158, 11, 0.25)' : 'var(--void-2)',
                  border: `1px solid ${isClickThrough ? 'var(--status-warning)' : 'rgba(255, 255, 255, 0.22)'}`,
                  color: isClickThrough ? 'var(--status-warning)' : 'var(--text-silver)',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  pointerEvents: 'auto',
                }}
                title={isClickThrough ? 'Pass-Through active (clicks pass through to game)' : 'Activate Pass-Through (clicks pass to underlying game)'}
              >
                <IconClickThrough size={10} />
                <span>{isClickThrough ? 'PASS-THRU' : 'TOUCH'}</span>
              </button>

              {/* Mode Toggle Button: MIN <-> MAX */}
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setWindowMode((prev) => (prev === 'minimized' ? 'maximized' : 'minimized'));
                }}
                style={{
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: 'var(--text-silver)',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '2px',
                  fontWeight: 600,
                  pointerEvents: 'auto',
                }}
                title={windowMode === 'minimized' ? 'Maximize window and reveal chat switcher' : 'Minimize window to compact chat view'}
              >
                {windowMode === 'minimized' ? 'MAX' : 'MIN'}
              </button>

              {/* "✕" Button -> Converts back to Bubble Form */}
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setIsBubbleForm(true);
                }}
                style={{
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '3px 7px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '2px',
                  pointerEvents: 'auto',
                }}
                title="Convert to Floating Bubble"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Maximized Mode: Conversation Switcher Row */}
          {/* Lets users switch chats with other people directly from HUD */}
          {windowMode === 'maximized' && (
            <div
              style={{
                padding: '6px 10px',
                background: 'rgba(11, 13, 17, 0.98)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                pointerEvents: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {conversationList.map((item) => {
                const isSelected = item.pubkey === activePubkey;
                return (
                  <button
                    key={item.pubkey}
                    onClick={() => {
                      SoundEngine.playBladeTick();
                      setActiveConversation(item.pubkey);
                    }}
                    style={{
                      background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#000000' : 'var(--text-silver)',
                      border: `1px solid ${isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.16)'}`,
                      borderRadius: '2px',
                      padding: '3px 8px',
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{item.alias.toUpperCase()}</span>
                    {item.unreadCount > 0 && (
                      <span
                        style={{
                          background: isSelected ? '#000000' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#000000',
                          borderRadius: '2px',
                          padding: '0 3px',
                          fontSize: '8px',
                          fontWeight: 800,
                        }}
                      >
                        {item.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages Stream (Last 25 messages, solid text & readable cards) */}
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
            {isGroupActive && groupMessages.length > 0 ? (
              groupMessages.slice(-25).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '7px 10px',
                    background: msg.authorAlias === 'You' ? 'rgba(25, 30, 40, 0.92)' : 'rgba(14, 17, 23, 0.90)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '2px',
                    fontSize: '12px',
                    color: '#ffffff',
                    alignSelf: msg.authorAlias === 'You' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ fontSize: '9px', color: 'var(--text-silver)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                    {msg.authorAlias || msg.senderTag || 'Teammate'}
                  </div>
                  {msg.content}
                </div>
              ))
            ) : directMessages.length > 0 ? (
              directMessages.slice(-25).map((msg) => {
                const isMe = msg.senderPubkey !== activePubkey;
                return (
                  <div
                    key={msg.id}
                    style={{
                      padding: '7px 10px',
                      background: isMe ? 'rgba(25, 30, 40, 0.92)' : 'rgba(14, 17, 23, 0.90)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      borderRadius: '2px',
                      fontSize: '12px',
                      color: '#ffffff',
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ fontSize: '9px', color: 'var(--text-silver)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                      {isMe ? 'You' : activeTitle}
                    </div>
                    {msg.content}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-silver)', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(11, 13, 17, 0.5)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '2px' }}>
                NO TRANSMISSIONS YET
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Bar (Opaque background so user can type even when window is transparent) */}
          <form
            onSubmit={handleSendQuickReply}
            style={{
              padding: '8px 10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.14)',
              display: 'flex',
              gap: '6px',
              background: 'rgba(11, 13, 17, 0.98)',
              pointerEvents: 'auto',
            }}
          >
            <input
              type="text"
              placeholder={activePubkey ? 'Whisper...' : 'Select contact...'}
              value={replyText}
              disabled={!activePubkey}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--void-0)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
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
              disabled={!activePubkey || !replyText.trim()}
              icon={<IconBladeSend size={11} color="#000" />}
              style={{ minHeight: '30px', padding: '0 10px', fontSize: '10px' }}
            >
              SEND
            </ChromeButton>
          </form>

          {/* Tactical Resize Grip (Active in Maximized Mode) */}
          {windowMode === 'maximized' && (
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
                background: 'rgba(255, 255, 255, 0.08)',
                borderTopLeftRadius: '3px',
                zIndex: 10,
              }}
              title="Drag to resize HUD window"
            >
              <svg width="8" height="8" viewBox="0 0 8 8">
                <line x1="7" y1="1" x2="1" y2="7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="7" y1="4" x2="4" y2="7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
