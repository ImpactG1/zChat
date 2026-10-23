import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Contact } from '@/types';
import { parsePubkeyAndAlias } from '@/core/crypto/keys';
import { profileService } from '@/core/nostr/profileService';
import { useP2PStore } from '@/stores/useP2PStore';
import { GroupManager } from '@/core/groups/groupManager';
import { HostSquadModal } from '@/components/p2p/HostSquadModal';
import { JoinSquadModal } from '@/components/p2p/JoinSquadModal';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import { TrackedBadge } from '@/components/design-system/TrackedBadge';
import {
  IconShieldLock,
  IconSearchLoupe,
  IconCrown,
  IconChevron,
  IconClose,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

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
  activeGroupId,
  onSelectContact,
  onSelectGroup,
  onSelectSquad,
}) => {
  const [tab, setTab] = useState<'groups' | 'direct'>('groups');
  const { roomState } = useP2PStore();

  // Load contacts dynamically from Dexie DB
  const contacts = useLiveQuery(async () => {
    try {
      return await db.contacts.orderBy('lastTimestamp').reverse().toArray();
    } catch {
      return [];
    }
  }) ?? [];

  // Load groups dynamically from Dexie DB
  const groups = useLiveQuery(async () => {
    try {
      return await db.groups.orderBy('lastTimestamp').reverse().toArray();
    } catch {
      return [];
    }
  }) ?? [];

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showHostSquadModal, setShowHostSquadModal] = useState(false);
  const [showJoinSquadModal, setShowJoinSquadModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Add Contact Form State
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newAliasInput, setNewAliasInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');

  const filteredContacts = contacts.filter((c) =>
    c.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const { pubkey: hexPubkey, suggestedAlias } = parsePubkeyAndAlias(newKeyInput);
    if (!hexPubkey) {
      setErrorMsg('Invalid public key (must be 64-char hex or npub1...)');
      return;
    }

    const alias = newAliasInput.trim() || suggestedAlias || `Warrior#${hexPubkey.slice(0, 4)}`;
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
    profileService.fetchWarriorProfile(hexPubkey).catch(() => {});
    SoundEngine.playSealChime();
    setShowAddContactModal(false);
    setNewKeyInput('');
    setNewAliasInput('');
    onSelectContact(hexPubkey);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const newG = await GroupManager.createGroup(
        newGroupName.trim(),
        contacts.map((c) => c.pubkey)
      );
      SoundEngine.playSealChime();
      setShowCreateGroupModal(false);
      setNewGroupName('');
      onSelectGroup(newG.id);
    } catch (err) {
      console.error('Failed to create sanctum:', err);
    }
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const now = Date.now();
    const diffMins = Math.floor((now - ts) / (1000 * 60));
    if (diffMins < 1) return 'NOW';
    if (diffMins < 60) return `${diffMins}M`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}H`;
    return `${Math.floor(diffHours / 24)}D`;
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
      {/* Category Blade Tabs */}
      <div style={{ display: 'flex', padding: '6px 12px 2px', gap: '8px' }}>
        <button
          onClick={() => {
            SoundEngine.playBladeTick();
            setTab('groups');
          }}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            cursor: 'pointer',
            background: tab === 'groups' ? 'var(--void-2)' : 'transparent',
            border: tab === 'groups' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: tab === 'groups' ? '#ffffff' : 'var(--text-muted)',
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '9px', opacity: tab === 'groups' ? 1 : 0.4 }}>◆</span>
          <span>GROUPS</span>
        </button>

        <button
          onClick={() => {
            SoundEngine.playBladeTick();
            setTab('direct');
          }}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            cursor: 'pointer',
            background: tab === 'direct' ? 'var(--void-2)' : 'transparent',
            border: tab === 'direct' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: tab === 'direct' ? '#ffffff' : 'var(--text-muted)',
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '9px', opacity: tab === 'direct' ? 1 : 0.4 }}>◆</span>
          <span>PRIVATE</span>
        </button>
      </div>

      {/* TAB 1: GROUPS */}
      {tab === 'groups' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Quick Tactical Action Blades */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <ChromeButton
              variant="outline"
              size="sm"
              onClick={() => setShowCreateGroupModal(true)}
              icon={<IconCrown size={13} />}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              + CREATE NEW GROUP
            </ChromeButton>
            <div style={{ display: 'flex', gap: '6px' }}>
              <ChromeButton
                variant="ghost"
                size="sm"
                onClick={() => setShowHostSquadModal(true)}
                style={{ flex: 1, border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '10px' }}
              >
                HOST P2P
              </ChromeButton>
              <ChromeButton
                variant="ghost"
                size="sm"
                onClick={() => setShowJoinSquadModal(true)}
                style={{ flex: 1, border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '10px' }}
              >
                JOIN CODE
              </ChromeButton>
            </div>
          </div>

          {/* Active Live P2P Squad if connected */}
          {roomState.code && (
            <div
              onClick={() => onSelectSquad(roomState.code!)}
              style={{
                position: 'relative',
                padding: '14px 16px',
                background: 'var(--void-2)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                cursor: 'pointer',
              }}
            >
              {/* Unread / Active Light Sliver on Left Edge */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  bottom: '15%',
                  width: '2px',
                  background: '#ffffff',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.85)',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <TrackedBadge label="DIRECT UDP MESH" variant="chrome" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--status-online)' }}>
                  ⚡ {roomState.averagePing > 0 ? `${roomState.averagePing}ms` : '<20ms'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.15em', color: '#ffffff', margin: 0 }}>
                    ROOM: {roomState.code}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {Object.keys(roomState.peers).length + 1} Members in Room
                  </p>
                </div>
                <IconChevron size={14} direction="right" color="var(--text-silver)" />
              </div>
            </div>
          )}

          {/* Pinned Groups List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="tracked-micro" style={{ paddingLeft: '4px', margin: '4px 0 2px' }}>
              GROUPS ({groups.length})
            </div>

            {groups.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  background: 'var(--void-1)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  margin: '8px 0',
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
              >
                <IconCrown size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                <div className="font-display" style={{ fontSize: '12px', letterSpacing: '0.2em', color: '#ffffff', marginBottom: '6px' }}>
                  NO ACTIVE GROUPS
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '260px', margin: '0 auto 14px', lineHeight: 1.5 }}>
                  Create an encrypted group or host a P2P room to chat with your friends.
                </p>
                <ChromeButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateGroupModal(true)}
                  icon={<IconCrown size={12} />}
                  style={{ margin: '0 auto' }}
                >
                  CREATE GROUP
                </ChromeButton>
              </div>
            ) : (
              groups.map((group) => {
                const isSelected = group.id === activeGroupId;
                const hasUnread = (group.unreadCount || 0) > 0;

              return (
                <div
                  key={group.id}
                  onClick={() => {
                    SoundEngine.playBladeTick();
                    onSelectGroup(group.id);
                  }}
                  style={{
                    position: 'relative',
                    padding: '14px 16px',
                    background: isSelected ? 'var(--void-3)' : 'var(--void-1)',
                    border: isSelected
                      ? '1px solid rgba(255, 255, 255, 0.45)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {/* Unread Indicator: Razor-Thin Specular White Light Sliver on Left Edge */}
                  {hasUnread && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '12%',
                        bottom: '12%',
                        width: '2px',
                        background: '#ffffff',
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.95)',
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '8px' }}>◆</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '13px',
                          letterSpacing: '0.12em',
                          fontWeight: 700,
                          color: isSelected ? '#ffffff' : 'var(--text-silver)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {group.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatTimestamp(group.lastTimestamp)}
                      </span>
                      {hasUnread && (
                        <span
                          style={{
                            padding: '1px 5px',
                            background: '#ffffff',
                            color: '#000000',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            fontWeight: 700,
                            borderRadius: '1px',
                          }}
                        >
                          {group.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '280px',
                      }}
                    >
                      {group.lastMessage || 'Group created.'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: 'var(--status-encrypted)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        EPOCH {group.currentEpoch}
                      </span>
                      <IconCrown size={12} color="var(--text-muted)" />
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      ) : (
        /* TAB 2: PRIVATE CHANNELS */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search & Add Blade Bar */}
          <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <BladeInput
                placeholder="Search by alias or tag (#8f3a)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<IconSearchLoupe size={15} />}
                style={{ height: '38px', fontSize: '13px' }}
              />
            </div>
            <ChromeButton
              variant="solid"
              size="sm"
              onClick={() => {
                SoundEngine.playBladeTick();
                setShowAddContactModal(true);
              }}
              style={{ minHeight: '38px', padding: '0 14px' }}
            >
              + NEW CHAT
            </ChromeButton>
          </div>

          {/* Contact List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredContacts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  background: 'var(--void-1)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  margin: '12px 0',
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
              >
                <IconShieldLock size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div className="font-display" style={{ fontSize: '13px', letterSpacing: '0.2em', color: '#ffffff', marginBottom: '4px' }}>
                  NO PRIVATE CHATS
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
                  No channels found in this sector. Start a new chat using a friend's public key or npub.
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = contact.pubkey === activePubkey;
                const hasUnread = (contact.unreadCount || 0) > 0;

                return (
                  <div
                    key={contact.pubkey}
                    onClick={() => {
                      SoundEngine.playBladeTick();
                      onSelectContact(contact.pubkey);
                    }}
                    style={{
                      position: 'relative',
                      padding: '12px 14px',
                      background: isSelected ? 'var(--void-3)' : 'var(--void-1)',
                      border: isSelected
                        ? '1px solid rgba(255, 255, 255, 0.45)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {/* Unread Indicator: Razor-Thin Specular White Light Sliver on Left Edge */}
                    {hasUnread && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '15%',
                          bottom: '15%',
                          width: '2px',
                          background: '#ffffff',
                          boxShadow: '0 0 8px rgba(255, 255, 255, 0.95)',
                        }}
                      />
                    )}

                    {/* Sharp Faceted Avatar Sigil */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        background: 'var(--void-2)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontSize: '12px',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.05em',
                        clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                        flexShrink: 0,
                      }}
                    >
                      {contact.alias.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Contact Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 700,
                              fontSize: '13px',
                              letterSpacing: '0.1em',
                              color: isSelected ? '#ffffff' : 'var(--text-silver)',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {contact.alias}
                          </span>
                          {/* Handle format: name#a3f9 */}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                            {contact.tag}
                          </span>
                        </div>

                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                          {formatTimestamp(contact.lastTimestamp)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '240px',
                          }}
                        >
                          {contact.lastMessage || 'End-to-end encrypted message.'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconShieldLock size={11} color="var(--status-encrypted)" />
                          {hasUnread && (
                            <span
                              style={{
                                padding: '1px 5px',
                                background: '#ffffff',
                                color: '#000000',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '9px',
                                fontWeight: 700,
                                borderRadius: '1px',
                              }}
                            >
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Form Group Modal */}
      {showCreateGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <form
            onSubmit={handleCreateGroup}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--void-1)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              padding: '24px',
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tracked-micro">NEW GROUP</span>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <IconClose size={14} />
              </button>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.18em', color: '#ffffff', textTransform: 'uppercase', margin: 0 }}>
              CREATE GROUP
            </h3>

            <BladeInput
              label="GROUP NAME"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Squad Alpha, Gaming Buddies"
              autoFocus
              required
            />

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              A private encryption key will be created so only group members can read messages.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <ChromeButton variant="ghost" size="sm" type="button" onClick={() => setShowCreateGroupModal(false)}>
                CANCEL
              </ChromeButton>
              <ChromeButton variant="solid" size="sm" type="submit">
                CREATE GROUP
              </ChromeButton>
            </div>
          </form>
        </div>
      )}

      {/* Add Friend / Start Private Chat Modal */}
      {showAddContactModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <form
            onSubmit={handleAddContact}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--void-1)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              padding: '24px',
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tracked-micro">NEW PRIVATE CHAT</span>
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <IconClose size={14} />
              </button>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.18em', color: '#ffffff', textTransform: 'uppercase', margin: 0 }}>
              ADD FRIEND BY PUBLIC KEY
            </h3>

            <BladeInput
              label="FRIEND'S PUBLIC KEY (NPUB OR HEX)"
              value={newKeyInput}
              onChange={(e) => {
                const val = e.target.value;
                setNewKeyInput(val);
                const { pubkey, suggestedAlias } = parsePubkeyAndAlias(val);
                if (suggestedAlias && !newAliasInput) {
                  setNewAliasInput(suggestedAlias);
                }
                if (pubkey && !newAliasInput && !suggestedAlias) {
                  profileService.fetchWarriorProfile(pubkey).then((res) => {
                    if (res?.name && !newAliasInput) {
                      setNewAliasInput(res.name);
                    }
                  });
                }
              }}
              placeholder="npub1... or hex key"
              required
              autoFocus
            />

            <BladeInput
              label="WARRIOR TITLE / NAME"
              value={newAliasInput}
              onChange={(e) => setNewAliasInput(e.target.value)}
              placeholder="e.g. Viper, Ghost"
            />

            {errorMsg && (
              <div style={{ color: 'var(--status-error)', fontSize: '11px' }}>
                ✕ {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <ChromeButton variant="ghost" size="sm" type="button" onClick={() => setShowAddContactModal(false)}>
                CANCEL
              </ChromeButton>
              <ChromeButton variant="solid" size="sm" type="submit">
                START CHAT
              </ChromeButton>
            </div>
          </form>
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
    </div>
  );
};
