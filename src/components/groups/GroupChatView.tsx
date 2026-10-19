import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { GroupManager } from '@/core/groups/groupManager';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowLeft, Send, Users, RotateCw, UserPlus, Shield } from 'lucide-react';

interface GroupChatViewProps {
  groupId: string;
  onBack: () => void;
}

export const GroupChatView: React.FC<GroupChatViewProps> = ({ groupId, onBack }) => {
  const { identity } = useAuthStore();
  const group = useLiveQuery(() => db.groups.get(groupId), [groupId]);
  const messages = useLiveQuery(
    () => db.groupMessages.where('groupId').equals(groupId).sortBy('timestamp'),
    [groupId]
  ) ?? [];

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contacts = useLiveQuery(() => db.contacts.toArray()) ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (group && group.unreadCount > 0) {
      db.groups.update(groupId, { unreadCount: 0 });
    }
  }, [groupId, group?.unreadCount]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);
    try {
      await GroupManager.sendGroupMessage(groupId, text);
    } catch (err) {
      console.error('Failed to send group message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleRotateKey = async () => {
    if (!confirm('Rotate group encryption key for forward secrecy? All members will receive the new epoch key.')) {
      return;
    }
    setIsRotating(true);
    try {
      await GroupManager.rotateGroupKey(groupId);
    } catch (err) {
      alert('Only the party leader can rotate the key.');
    } finally {
      setIsRotating(false);
    }
  };

  if (!group) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading squad...</p>
      </div>
    );
  }

  const isLeader = group.adminPubkey === identity?.pubkey;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Group Header */}
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
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{group.name}</span>
              <span
                style={{
                  fontSize: '10px',
                  background: 'rgba(157, 78, 221, 0.2)',
                  color: 'var(--accent-purple)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Epoch #{group.currentEpoch}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={12} />
              <span>{group.members.length} members</span>
              {isLeader && <span style={{ color: 'var(--accent-cyan)' }}>• You are Party Leader</span>}
            </div>
          </div>
        </div>

        {/* Leader Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {isLeader && (
            <button
              onClick={handleRotateKey}
              disabled={isRotating}
              className="cyber-button"
              style={{ padding: '6px 8px', fontSize: '11px' }}
              title="Rotate Group Epoch Key"
            >
              <RotateCw size={12} className={isRotating ? 'animate-spin' : ''} />
              <span>Rotate</span>
            </button>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="cyber-button"
            style={{ padding: '6px 8px', fontSize: '11px' }}
            title="Invite Teammate"
          >
            <UserPlus size={13} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Shield size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p>🛡️ End-to-end encrypted group party.</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>Messages are encrypted with ChaCha20 epoch key.</p>
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
                {!isMe && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '2px', paddingLeft: '4px' }}>
                    {msg.senderTag}
                  </span>
                )}
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

      {/* Message Input Bar */}
      <form onSubmit={handleSend} style={{ padding: '8px 12px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          className="cyber-input"
          placeholder="Message squad party..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="cyber-button"
          style={{ padding: '10px 16px', opacity: !inputText.trim() || isSending ? 0.5 : 1 }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '380px', padding: '20px' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>Invite Teammate to {group.name}</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {contacts.map((c) => (
                <div
                  key={c.pubkey}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.alias}</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginLeft: '6px' }}>{c.tag}</span>
                  </div>
                  <button
                    onClick={async () => {
                      await GroupManager.createGroup(group.name, [...group.members, c.pubkey]);
                      setShowInviteModal(false);
                    }}
                    className="cyber-button"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowInviteModal(false)}
              className="cyber-button"
              style={{ width: '100%', background: 'transparent' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
