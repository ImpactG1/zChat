import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Contact } from '@/types';
import { parsePubkeyInput } from '@/core/crypto/keys';
import { useP2PStore } from '@/stores/useP2PStore';
import { HostSquadModal } from '@/components/p2p/HostSquadModal';
import { JoinSquadModal } from '@/components/p2p/JoinSquadModal';
import {
  UserPlus,
  MessageSquare,
  Search,
  ShieldAlert,
  Users,
  Radio,
  Zap,
  ArrowRight,
  Wifi,
  Copy,
  Check,
} from 'lucide-react';

interface ConversationListProps {
  activePubkey?: string;
  activeGroupId?: string;
  activeSquadCode?: string;
  onSelectContact: (pubkey: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectSquad: (code: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  activePubkey,
  onSelectContact,
  onSelectSquad,
}) => {
  const [tab, setTab] = useState<'groups' | 'direct'>('groups');
  const { roomState } = useP2PStore();

  const contacts = useLiveQuery(async () => {
    try {
      const list = await db.contacts.toArray();
      return list.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
    } catch {
      return [];
    }
  }) ?? [];

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showHostSquadModal, setShowHostSquadModal] = useState(false);
  const [showJoinSquadModal, setShowJoinSquadModal] = useState(false);
  const [copiedActiveCode, setCopiedActiveCode] = useState(false);

  // Add Contact Form State
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
      setErrorMsg('Invalid public key (must be 64-char hex or npub1...)');
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
    setShowAddContactModal(false);
    setNewKeyInput('');
    setNewAliasInput('');
    onSelectContact(hexPubkey);
  };

  const copyActiveSquadCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!roomState.code) return;
    navigator.clipboard.writeText(roomState.code);
    setCopiedActiveCode(true);
    setTimeout(() => setCopiedActiveCode(false), 2000);
  };

  const peerCount = Object.keys(roomState.peers).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab Switcher: Squads vs Direct */}
      <div style={{ display: 'flex', padding: '6px 12px 2px', gap: '8px' }}>
        <button
          onClick={() => setTab('groups')}
          className="cyber-button"
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            background: tab === 'groups' ? 'rgba(157, 78, 221, 0.25)' : 'transparent',
            borderColor: tab === 'groups' ? 'var(--accent-purple)' : 'var(--border-subtle)',
          }}
        >
          <Radio size={14} color={tab === 'groups' ? 'var(--accent-purple)' : 'var(--text-muted)'} />
          <span>Party Squads (P2P)</span>
        </button>

        <button
          onClick={() => setTab('direct')}
          className="cyber-button"
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '13px',
            background: tab === 'direct' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
            borderColor: tab === 'direct' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
          }}
        >
          <MessageSquare size={14} color={tab === 'direct' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
          <span>Direct (1:1)</span>
        </button>
      </div>

      {/* Main Content Area */}
      {tab === 'groups' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Quick Squad Action Bar */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowHostSquadModal(true)}
              className="cyber-button"
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.3), rgba(0, 240, 255, 0.2))',
                borderColor: 'var(--accent-purple)',
              }}
            >
              <Zap size={16} color="var(--accent-purple)" />
              <span>Host Squad</span>
            </button>

            <button
              onClick={() => setShowJoinSquadModal(true)}
              className="cyber-button"
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                background: 'transparent',
                borderColor: 'var(--accent-cyan)',
              }}
            >
              <Users size={16} color="var(--accent-cyan)" />
              <span>Join with Code</span>
            </button>
          </div>

          {/* Active Live Squad Card (if connected) */}
          {roomState.code ? (
            <div
              onClick={() => onSelectSquad(roomState.code)}
              className="glass-panel-glow"
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderColor: 'var(--accent-purple)',
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.15), rgba(8, 10, 15, 0.9))',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Squad Connected
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  <Wifi size={13} />
                  <span>{roomState.averagePing > 0 ? `${roomState.averagePing}ms` : '<25ms'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
                    {roomState.code}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {peerCount + 1} players in squad • Direct UDP Mesh
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={copyActiveSquadCode}
                    className="cyber-button"
                    style={{ padding: '6px 10px', fontSize: '11px', background: 'rgba(157, 78, 221, 0.2)' }}
                    title="Copy Squad Code"
                  >
                    {copiedActiveCode ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    <span>{copiedActiveCode ? 'COPIED' : 'CODE'}</span>
                  </button>

                  <button
                    className="cyber-button"
                    style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--accent-purple)' }}
                  >
                    <span>Enter HUD</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <Radio size={36} color="var(--accent-purple)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                Ultra-Fast P2P Gaming Squads
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '320px', margin: '0 auto 16px' }}>
                Connect players from Mumbai, Delhi, Bangalore, or anywhere in India directly with <strong>15–35ms ping</strong> over WebRTC UDP. Zero server lag, zero 64-char crypto keys.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowHostSquadModal(true)}
                  className="cyber-button"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Create 6-Digit Party Code
                </button>
              </div>
            </div>
          )}

          {/* Connected Squad Teammates from recent sessions */}
          {contacts.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '4px' }}>
                Teammates Met in Squads ({contacts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {contacts.map((c) => (
                  <div
                    key={c.pubkey}
                    onClick={() => onSelectContact(c.pubkey)}
                    className="glass-panel"
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(0, 240, 255, 0.15)',
                          border: '1px solid var(--accent-cyan)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: 'var(--accent-cyan)',
                        }}
                      >
                        {c.alias.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.alias}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.tag}</div>
                      </div>
                    </div>

                    <button
                      className="cyber-button"
                      style={{ padding: '4px 8px', fontSize: '11px', background: 'transparent' }}
                    >
                      <MessageSquare size={12} />
                      <span>1:1 Chat</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Direct 1:1 Tab */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search & Add Bar */}
          <div style={{ padding: '8px 12px', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              <input
                type="text"
                className="cyber-input"
                placeholder="Search teammates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="cyber-button"
              style={{ padding: '8px 12px' }}
              title="Add Contact"
            >
              <UserPlus size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
            {filteredContacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>No direct conversations.</p>
                <p style={{ fontSize: '12px' }}>Join a squad party or add a friend to start chatting.</p>
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
                        {contact.lastMessage || 'End-to-end encrypted'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Host Squad Modal */}
      {showHostSquadModal && (
        <HostSquadModal
          onClose={() => setShowHostSquadModal(false)}
          onSquadCreated={(code) => {
            onSelectSquad(code);
          }}
        />
      )}

      {/* Join Squad Modal */}
      {showJoinSquadModal && (
        <JoinSquadModal
          onClose={() => setShowJoinSquadModal(false)}
          onSquadJoined={(code) => {
            onSelectSquad(code);
          }}
        />
      )}

      {/* Add Teammate by Pubkey Modal (Advanced Fallback) */}
      {showAddContactModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '420px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--accent-cyan)" />
              Add Teammate
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
                  Nickname / Gamer Tag
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
                  style={{ background: 'transparent' }}
                  onClick={() => setShowAddContactModal(false)}
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
