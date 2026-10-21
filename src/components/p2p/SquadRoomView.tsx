import React, { useState, useEffect, useRef } from 'react';
import { useP2PStore } from '@/stores/useP2PStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { MessageBubble } from '@/components/design-system/MessageBubble';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import {
  IconBladeSend,
  IconChevron,
  IconCopyBlade,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface SquadRoomViewProps {
  onBack: () => void;
}

export const SquadRoomView: React.FC<SquadRoomViewProps> = ({ onBack }) => {
  const { roomState, messages, sendMessage, leaveSquad } = useP2PStore();
  const { identity } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const peersList = Object.values(roomState.peers);
  const connectedPeers = peersList.filter((p) => p.connectionState === 'connected');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    SoundEngine.playBladeTick();
    await sendMessage(text);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    SoundEngine.playBladeTick();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeave = () => {
    SoundEngine.playBladeTick();
    leaveSquad();
    onBack();
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--void-0)',
      }}
    >
      {/* Top HUD Squad Header */}
      <div
        style={{
          margin: '0 12px 6px',
          padding: '10px 14px',
          background: 'var(--void-1)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              SoundEngine.playBladeTick();
              onBack();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-silver)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <IconChevron size={16} direction="left" />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '15px',
                  letterSpacing: '0.15em',
                  color: '#ffffff',
                }}
              >
                SANCTUM: {roomState.code}
              </span>

              <button
                onClick={copyCode}
                style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--void-2)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: copiedCode ? '#ffffff' : 'var(--text-silver)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Copy Squad Code"
              >
                <IconCopyBlade size={10} />
                <span>{copiedCode ? 'COPIED' : 'CODE'}</span>
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <span style={{ color: 'var(--status-relay-ok)' }}>◆ Direct UDP Mesh</span>
              <span>•</span>
              <span style={{ color: 'var(--text-silver)' }}>
                {connectedPeers.length + 1} Warriors in Mesh
              </span>
            </div>
          </div>
        </div>

        {/* Live Ping & Disconnect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '2px',
              background: 'var(--void-2)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--status-online)',
            }}
          >
            <span>⚡ {roomState.averagePing > 0 ? `${roomState.averagePing}ms` : '<20ms'}</span>
          </div>

          <button
            onClick={handleLeave}
            style={{
              padding: '6px 10px',
              background: 'rgba(139, 52, 52, 0.2)',
              border: '1px solid rgba(139, 52, 52, 0.5)',
              color: 'var(--status-error)',
              fontSize: '11px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
            title="Leave Sanctum"
          >
            DISCONNECT
          </button>
        </div>
      </div>

      {/* Teammates Bar */}
      <div
        style={{
          padding: '4px 12px 8px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '2px',
            background: 'var(--void-2)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            fontSize: '11px',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ width: '4px', height: '4px', background: '#ffffff', transform: 'rotate(45deg)' }} />
          <span style={{ fontWeight: 600, color: '#ffffff' }}>{identity?.displayName || 'You'}</span>
          <span style={{ color: 'var(--text-muted)' }}>(Host)</span>
        </div>

        {peersList.map((peer) => {
          const isConnected = peer.connectionState === 'connected';
          return (
            <div
              key={peer.peerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '2px',
                background: 'var(--void-2)',
                border: `1px solid ${isConnected ? 'rgba(82, 128, 104, 0.45)' : 'rgba(255, 255, 255, 0.1)'}`,
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  background: isConnected ? 'var(--status-relay-ok)' : 'var(--status-warning)',
                  transform: 'rotate(45deg)',
                }}
              />
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{peer.gamerTag}</span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {isConnected ? `${peer.pingMs || 18}ms` : 'syncing'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Message List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              margin: 'auto',
              background: 'var(--void-1)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              maxWidth: '340px',
            }}
          >
            <div className="font-display" style={{ fontSize: '13px', letterSpacing: '0.2em', color: '#ffffff', marginBottom: '4px' }}>
              SANCTUM CHANNEL ACTIVE
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Direct WebRTC peer mesh open. Transmit orders below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === 'self';
            return (
              <MessageBubble
                key={msg.id}
                id={msg.id}
                content={msg.content}
                timestamp={msg.timestamp}
                isSelf={isMe}
                senderName={isMe ? undefined : msg.senderTag}
                status="delivered"
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '8px 12px 12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: 'var(--void-0)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ flex: 1 }}>
          <BladeInput
            placeholder={`Transmit to Sanctum ${roomState.code}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ height: '42px' }}
          />
        </div>

        <ChromeButton
          variant="solid"
          size="md"
          type="submit"
          disabled={!inputText.trim()}
          icon={<IconBladeSend size={15} color="#000" />}
          style={{ height: '42px', minHeight: '42px', padding: '0 16px' }}
        >
          SEAL
        </ChromeButton>
      </form>
    </div>
  );
};
