import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Contact, GroupChat } from '@/types';
import { parsePubkeyInput } from '@/core/crypto/keys';
import { GroupManager } from '@/core/groups/groupManager';
import { UserPlus, MessageSquare, Search, ShieldAlert, Users, Plus } from 'lucide-react';

interface ConversationListProps {
  activePubkey?: string;
  activeGroupId?: string;
  onSelectContact: (pubkey: string) => void;
  onSelectGroup: (groupId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  activePubkey,
  activeGroupId,
  onSelectContact,
  onSelectGroup,
}) => {
  const [tab, setTab] = useState<'direct' | 'groups'>('direct');
  const contacts = useLiveQuery(() => db.contacts.orderBy('lastTimestamp').reverse().toArray()) ?? [];
  const groups = useLiveQuery(() => db.groups.orderBy('lastTimestamp').reverse().toArray()) ?? [];

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Add Contact Form State
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newAliasInput, setNewAliasInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create Group Form State
  const [groupNameInput, setGroupNameInput] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((c) =>
    c.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((g: GroupChat) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    setShowAddContactModal(false);
    setNewKeyInput('');
    setNewAliasInput('');
    onSelectContact(hexPubkey);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    const group = await GroupManager.createGroup(groupNameInput.trim(), selectedGroupMembers);
    setShowCreateGroupModal(false);
    setGroupNameInput('');
    setSelectedGroupMembers([]);
    onSelectGroup(group.id);
  };

  const toggleMemberSelection = (pubkey: string) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(pubkey) ? prev.filter((p) => p !== pubkey) : [...prev, pubkey]
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab Switcher: Direct vs Squads */}
      <div style={{ display: 'flex', padding: '6px 12px 2px', gap: '8px' }}>
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
          <Users size={14} color={tab === 'groups' ? 'var(--accent-purple)' : 'var(--text-muted)'} />
          <span>Party Squads</span>
        </button>
      </div>

      {/* Top Search & Add Bar */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
          <input
            type="text"
            className="cyber-input"
            placeholder={tab === 'direct' ? 'Search teammates...' : 'Search squads...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>
        {tab === 'direct' ? (
          <button
            onClick={() => setShowAddContactModal(true)}
            className="cyber-button"
            style={{ padding: '8px 12px' }}
            title="Add Friend by Pubkey"
          >
            <UserPlus size={16} />
          </button>
        ) : (
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="cyber-button"
            style={{ padding: '8px 12px', background: 'rgba(157, 78, 221, 0.2)' }}
            title="Create Squad Party"
          >
            <Plus size={16} color="var(--accent-purple)" />
          </button>
        )}
      </div>

      {/* List Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {tab === 'direct' ? (
          filteredContacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>No direct conversations.</p>
              <p style={{ fontSize: '12px' }}>Tap + to add a friend's pubkey.</p>
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
          )
        ) : filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <Users size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>No party squads.</p>
            <p style={{ fontSize: '12px' }}>Create a squad party to chat with all your gaming teammates at once.</p>
          </div>
        ) : (
          filteredGroups.map((group: GroupChat) => {
            const isSelected = group.id === activeGroupId;
            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={isSelected ? 'glass-panel-glow' : 'glass-panel'}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderColor: isSelected ? 'var(--accent-purple)' : 'var(--border-subtle)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.3), rgba(244, 63, 94, 0.3))',
                    border: '1px solid var(--accent-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--accent-purple)',
                    fontSize: '16px',
                  }}
                >
                  <Users size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {group.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
                      Epoch #{group.currentEpoch}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {group.lastMessage || `${group.members.length} members in squad`}
                  </div>
                </div>
                {group.unreadCount > 0 && (
                  <div
                    className="badge-glow"
                    style={{
                      background: 'var(--accent-purple)',
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
                    {group.unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Teammate Modal */}
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

      {/* Create Squad Party Modal */}
      {showCreateGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '420px', padding: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent-purple)" />
              Assemble Squad Party
            </h3>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Squad Party Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Squad, Night Raid"
                  className="cyber-input"
                  style={{ width: '100%' }}
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Select Initial Teammates ({selectedGroupMembers.length} selected)
                </label>
                {contacts.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No teammates added yet. You can invite them after creating.</p>
                ) : (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {contacts.map((c) => {
                      const isChecked = selectedGroupMembers.includes(c.pubkey);
                      return (
                        <div
                          key={c.pubkey}
                          onClick={() => toggleMemberSelection(c.pubkey)}
                          style={{
                            padding: '8px',
                            background: isChecked ? 'rgba(157, 78, 221, 0.2)' : 'var(--bg-tertiary)',
                            border: `1px solid ${isChecked ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.alias}</span>
                          <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{c.tag}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="cyber-button"
                  style={{ background: 'transparent' }}
                  onClick={() => setShowCreateGroupModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cyber-button">
                  Launch Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
