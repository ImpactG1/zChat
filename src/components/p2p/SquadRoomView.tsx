import React, { useState, useEffect, useRef } from 'react';
import { useP2PStore } from '@/stores/useP2PStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowLeft, Send, Users, Wifi, Copy, Check, LogOut, Radio } from 'lucide-react';

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

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeave = () => {
    leaveSquad();
    onBack();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top HUD Squad Header */}
      <div
        className="glass-panel-glow"
        style={{
          margin: '0 12px 6px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderColor: 'var(--accent-purple)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onBack}
            className="cyber-button"
            style={{ padding: '6px', background: 'transparent', borderColor: 'transparent' }}
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
                {roomState.code}
              </span>

              <button
                onClick={copyCode}
                className="cyber-button"
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  background: 'rgba(157, 78, 221, 0.25)',
                  borderColor: 'var(--accent-purple)',
                }}
                title="Copy Squad Code for Teammates"
              >
                {copiedCode ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                <span>{copiedCode ? 'COPIED' : 'INVITE CODE'}</span>
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)' }}>
                <Radio size={12} />
                Direct WebRTC UDP Mesh
              </span>
              <span>•</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {connectedPeers.length + 1} in Party
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
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid var(--accent-cyan)',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
            }}
          >
            <Wifi size={13} />
            <span>{roomState.averagePing > 0 ? `${roomState.averagePing}ms` : '<25ms'}</span>
          </div>

          <button
            onClick={handleLeave}
            className="cyber-button"
            style={{ padding: '6px 10px', background: 'rgba(244, 63, 94, 0.2)', borderColor: 'var(--accent-rose)' }}
            title="Leave Squad"
          >
            <LogOut size={14} color="var(--accent-rose)" />
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
        {/* Self Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-glow)',
            fontSize: '11px',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
          <span style={{ fontWeight: 600 }}>{identity?.displayName || 'You'}</span>
          <span style={{ color: 'var(--text-muted)' }}>(Host)</span>
        </div>

        {/* Peer Badges with Live Ping */}
        {peersList.map((peer) => {
          const isConnected = peer.connectionState === 'connected';
          return (
            <div
              key={peer.peerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: `1px solid ${isConnected ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                }}
              />
              <span style={{ fontWeight: 600 }}>{peer.gamerTag}</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {isConnected ? `${peer.pingMs || 18}ms` : 'syncing'}
              </span>
            </div>
          );
        })}

        {peersList.length === 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
            <span>Waiting for teammates to join with code</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{roomState.code}</span>
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '300px' }}>
            <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.4, color: 'var(--accent-purple)' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Squad Party Connected</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>
              Send game callouts, tactical coordinates, or chat. Messages travel directly via encrypted UDP.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === identity?.pubkey.slice(0, 16) || msg.senderPubkey === identity?.pubkey;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {!isMe && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '2px', paddingLeft: '4px' }}>
                    {msg.senderTag}
                  </span>
                )}

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(157, 78, 221, 0.35), rgba(0, 240, 255, 0.25))'
                      : 'var(--bg-card)',
                    border: isMe ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    backdropFilter: 'blur(8px)',
                    boxShadow: isMe ? '0 0 12px rgba(157, 78, 221, 0.15)' : undefined,
                  }}
                >
                  {msg.content}
                </div>

                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Squad Chat Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '8px 12px 12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          className="cyber-input"
          placeholder={`Callout to ${roomState.code}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ flex: 1 }}
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="cyber-button"
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
            opacity: !inputText.trim() ? 0.5 : 1,
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
