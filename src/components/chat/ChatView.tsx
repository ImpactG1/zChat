import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { sendDirectMessage } from '@/core/nostr/messageSender';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowLeft, Send, Check, CheckCheck, Clock, AlertCircle, Copy, ShieldCheck } from 'lucide-react';

interface ChatViewProps {
  contactPubkey: string;
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ contactPubkey, onBack }) => {
  const { identity } = useAuthStore();
  const contact = useLiveQuery(() => db.contacts.get(contactPubkey), [contactPubkey]);
  const messages = useLiveQuery(
    () => db.messages.where('conversationId').equals(contactPubkey).sortBy('timestamp'),
    [contactPubkey]
  ) ?? [];

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count when opening conversation
  useEffect(() => {
    if (contact && contact.unreadCount > 0) {
      db.contacts.update(contactPubkey, { unreadCount: 0 });
    }
  }, [contactPubkey, contact?.unreadCount]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

    setInputMessage('');
    setIsSending(true);

    try {
      await sendDirectMessage(contactPubkey, text);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const copyPubkey = () => {
    navigator.clipboard.writeText(contactPubkey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!contact) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading conversation...</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Active Chat Header */}
      <div
        className="glass-panel"
        style={{
          margin: '0 12px 6px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{contact.alias}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {contact.tag}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} color="var(--accent-emerald)" />
              NIP-17 ChaCha20-Poly1305 E2EE
            </div>
          </div>
        </div>

        {/* Copy Pubkey Action */}
        <button
          onClick={copyPubkey}
          className="cyber-button"
          style={{ padding: '6px 10px', fontSize: '11px' }}
          title="Copy Teammate Pubkey"
        >
          <Copy size={13} />
          <span>{copiedKey ? 'COPIED' : 'KEY'}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
            <p>🔒 End-to-end encrypted direct channel.</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>Messages are gift-wrapped and cannot be read by relays.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderPubkey === identity?.pubkey;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(157, 78, 221, 0.35))'
                      : 'var(--bg-card)',
                    border: isMe ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                    backdropFilter: 'blur(8px)',
                    boxShadow: isMe ? '0 0 14px rgba(0, 240, 255, 0.1)' : undefined,
                  }}
                >
                  {msg.content}
                </div>

                {/* Timestamp & Status Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', padding: '0 4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span>
                      {msg.status === 'pending' && <Clock size={11} color="var(--accent-amber)" />}
                      {msg.status === 'sent' && <Check size={12} color="var(--accent-cyan)" />}
                      {msg.status === 'delivered' && <CheckCheck size={12} color="var(--accent-emerald)" />}
                      {msg.status === 'failed' && <AlertCircle size={11} color="var(--accent-rose)" />}
                    </span>
                  )}
                </div>
              </div>
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
        }}
      >
        <input
          type="text"
          className="cyber-input"
          placeholder="Type message for team..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="cyber-button"
          style={{
            padding: '10px 16px',
            opacity: !inputMessage.trim() || isSending ? 0.5 : 1,
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
