import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Contact } from '@/types';
import { parsePubkeyInput } from '@/core/crypto/keys';
import { UserPlus, MessageSquare, Search, ShieldAlert } from 'lucide-react';

interface ConversationListProps {
  activePubkey?: string;
  onSelectContact: (pubkey: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ activePubkey, onSelectContact }) => {
  const contacts = useLiveQuery(() => db.contacts.orderBy('lastTimestamp').reverse().toArray()) ?? [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newAliasInput, setNewAliasInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((c) =>
    c.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const hexPubkey = parsePubkeyInput(newKeyInput);
    if (!hexPubkey) {
      setErrorMsg('Invalid Nostr public key (must be 64-char hex or npub1...)');
      return;
    }

    const alias = newAliasInput.trim() || `Gamer#${hexPubkey.slice(0, 4)}`;
    const newContact: Contact = {
      pubkey: hexPubkey,
      npub: '',
      alias,
      tag: `#${hexPubkey.slice(0, 4)}`,
      unreadCount: 0,
      isBlocked: false,
      lastTimestamp: Date.now(),
    };

    await db.contacts.put(newContact);
    setShowAddModal(false);
    setNewKeyInput('');
    setNewAliasInput('');
    onSelectContact(hexPubkey);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Search & Add Bar */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
          <input
            type="text"
            className="cyber-input"
            placeholder="Search party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="cyber-button"
          style={{ padding: '8px 12px' }}
          title="Add Friend by Pubkey"
        >
          <UserPlus size={16} />
        </button>
      </div>

      {/* Contacts List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>No conversations yet.</p>
            <p style={{ fontSize: '12px' }}>Tap the + button to add a friend's pubkey or invite a teammate.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = contact.pubkey === activePubkey;
            return (
              <div
                key={contact.pubkey}
                onClick={() => onSelectContact(contact.pubkey)}
                className={isSelected ? 'glass-panel-glow' : 'glass-panel'}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Avatar Icon */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(157, 78, 221, 0.2))',
                    border: '1px solid var(--border-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    fontSize: '16px',
                  }}
                >
                  {contact.alias.slice(0, 2).toUpperCase()}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.alias}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {contact.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {contact.lastMessage || 'End-to-end encrypted channel'}
                  </div>
                </div>

                {/* Unread Badge */}
                {contact.unreadCount > 0 && (
                  <div
                    className="badge-glow"
                    style={{
                      background: 'var(--accent-rose)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                    }}
                  >
                    {contact.unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '420px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--accent-cyan)" />
              Add Teammate / Friend
            </h3>
            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Public Key (Hex or npub1...)
                </label>
                <input
                  type="text"
                  required
                  placeholder="npub1... or 64-char hex pubkey"
                  className="cyber-input"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Nickname / Gamer Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shadow"
                  className="cyber-input"
                  style={{ width: '100%' }}
                  value={newAliasInput}
                  onChange={(e) => setNewAliasInput(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={14} />
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="cyber-button"
                  style={{ background: 'transparent', borderColor: 'var(--border-subtle)' }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cyber-button">
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
