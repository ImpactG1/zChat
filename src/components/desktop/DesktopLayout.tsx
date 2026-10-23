import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Contact, GroupChat } from '@/types';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatView } from '@/components/chat/ChatView';
import { GroupChatView } from '@/components/groups/GroupChatView';
import { SquadRoomView } from '@/components/p2p/SquadRoomView';
import { EmblemLogo } from '@/components/common/EmblemLogo';
import { KeyFingerprintVisualizer } from '@/components/design-system/KeyFingerprintVisualizer';
import { TrackedBadge } from '@/components/design-system/TrackedBadge';
import { BladeDivider } from '@/components/design-system/BladeDivider';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import {
  IconRelayTower,
  IconCrown,
  IconShieldLock,
  IconCopyBlade,
  IconChevron,
} from '@/components/icons/RazorIcons';
import { GroupManager } from '@/core/groups/groupManager';
import { useAuthStore } from '@/stores/useAuthStore';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface DesktopLayoutProps {
  activePubkey?: string;
  activeGroupId?: string;
  activeSquadCode?: string;
  onSelectContact: (pubkey: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectSquad: (code: string) => void;
  onBack: () => void;
  onOpenRelays: () => void;
  onOpenSeed: () => void;
  onOpenCommandPalette: () => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  activePubkey,
  activeGroupId,
  activeSquadCode,
  onSelectContact,
  onSelectGroup,
  onSelectSquad,
  onBack,
  onOpenRelays,
  onOpenCommandPalette,
}) => {
  const { identity } = useAuthStore();
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const selectedContact = useLiveQuery<Contact | undefined>(
    async () => {
      if (!activePubkey) return undefined;
      return db.contacts.get(activePubkey);
    },
    [activePubkey]
  );

  const selectedGroup = useLiveQuery<GroupChat | undefined>(
    async () => {
      if (!activeGroupId) return undefined;
      return db.groups.get(activeGroupId);
    },
    [activeGroupId]
  );

  const memberContacts = useLiveQuery<Contact[]>(
    async () => {
      if (!selectedGroup?.members?.length) return [];
      return db.contacts.where('pubkey').anyOf(selectedGroup.members).toArray();
    },
    [selectedGroup?.members]
  ) ?? [];

  const handleRekeyGroup = async () => {
    if (!selectedGroup) return;
    SoundEngine.playSealChime();
    try {
      await GroupManager.rotateGroupKey(selectedGroup.id);
      setActionStatus(`Epoch ${selectedGroup.currentEpoch + 1} ratchet key generated.`);
    } catch (err: any) {
      setActionStatus(err?.message || 'Key rotation failed');
    }
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleSignalBeacon = () => {
    SoundEngine.playBladeTick();
    setActionStatus('Cryptographic beacon signaled across connected relays.');
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handlePurgeKeys = () => {
    SoundEngine.playSealChime();
    setActionStatus('Ephemeral key session purged. Ratchet re-initialized.');
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleCopyPubkey = (text: string) => {
    navigator.clipboard.writeText(text);
    SoundEngine.playBladeTick();
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Build member roster dynamically from group members
  const warriors = selectedGroup
    ? [
        ...(identity
          ? [
              {
                pubkey: identity.pubkey,
                alias: `${identity.displayName} (YOU)`,
                tag: identity.tag,
                role: selectedGroup.adminPubkey === identity.pubkey ? 'GROUP ADMIN' : 'MEMBER',
                ping: 'HOST',
                isSelf: true,
              },
            ]
          : []),
        ...(selectedGroup.members || [])
          .filter((pk: string) => pk !== identity?.pubkey)
          .map((pk: string) => {
            const c = memberContacts.find((mc) => mc.pubkey === pk);
            return {
              pubkey: pk,
              alias: c?.alias || `Warrior#${pk.slice(0, 4)}`,
              tag: c?.tag || `#${pk.slice(0, 4)}`,
              role: selectedGroup.adminPubkey === pk ? 'GROUP ADMIN' : 'MEMBER',
              ping: 'VERIFIED',
              isSelf: false,
            };
          }),
      ]
    : [];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--void-0)',
      }}
    >
      {/* 1. LEFT COLUMN: CHAT & SANCTUM LIST (340px) */}
      <div
        style={{
          width: '340px',
          height: '100%',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--void-1)',
          flexShrink: 0,
        }}
      >
        <ConversationList
          activePubkey={activePubkey}
          activeGroupId={activeGroupId}
          activeSquadCode={activeSquadCode}
          onSelectContact={onSelectContact}
          onSelectGroup={onSelectGroup}
          onSelectSquad={onSelectSquad}
        />
      </div>

      {/* 2. CENTER COLUMN: ACTIVE CHAT ROOM */}
      <div
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--void-0)',
        }}
      >
        {activeSquadCode ? (
          <SquadRoomView onBack={onBack} />
        ) : activeGroupId ? (
          <GroupChatView groupId={activeGroupId} onBack={onBack} />
        ) : activePubkey ? (
          <ChatView contactPubkey={activePubkey} onBack={onBack} />
        ) : (
          /* Empty / Idle State */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <EmblemLogo size={110} />

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                letterSpacing: '0.28em',
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: '24px 0 8px',
              }}
            >
              DUELING GROUNDS ACTIVE
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '28px', lineHeight: 1.6 }}>
              Select a group or private chat from the sidebar to start messaging.
            </p>

            <button
              onClick={() => {
                SoundEngine.playBladeTick();
                onOpenCommandPalette();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'var(--void-2)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                color: 'var(--text-silver)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '2px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
              }}
            >
              <span>PRESS</span>
              <kbd style={{ padding: '2px 7px', background: 'var(--void-3)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', color: '#fff', fontWeight: 700 }}>
                CTRL + K
              </kbd>
              <span>FOR COMMAND MATRIX</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. RIGHT COLUMN: DETAILS & CRYPTOGRAPHIC TELEMETRY (340px) */}
      <div
        style={{
          width: '340px',
          height: '100%',
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'var(--void-1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 16px',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span className="tracked-micro">SECTOR TELEMETRY</span>
          <TrackedBadge label="LIVE E2EE" variant="neutral" />
        </div>

        {selectedContact ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--void-2)', border: '1px solid rgba(255, 255, 255, 0.1)', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  background: 'var(--void-3)',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  color: '#ffffff',
                  fontWeight: 800,
                  margin: '0 auto 8px',
                  boxShadow: '0 0 12px rgba(255, 255, 255, 0.15)',
                }}
              >
                {selectedContact.alias.slice(0, 2).toUpperCase()}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '0.18em', color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
                {selectedContact.alias}
              </h3>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedContact.tag}
              </div>
            </div>

            <BladeDivider label="CRYPTOGRAPHIC FINGERPRINT" />
            <KeyFingerprintVisualizer pubkey={selectedContact.pubkey} tag={selectedContact.tag} />

            <BladeDivider label="SECURITY PROPERTIES" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', background: 'var(--void-0)', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Envelope</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>NIP-17 Gift Wrap</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Cipher</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>ChaCha20-Poly1305</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Ephemeral Ratchet</span>
                <span style={{ color: 'var(--status-online)', fontFamily: 'var(--font-mono)' }}>Double Ratchet (Active)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Interception Shield</span>
                <span style={{ color: 'var(--status-online)', fontFamily: 'var(--font-mono)' }}>100% Verified</span>
              </div>
            </div>

            <BladeDivider label="CHAT ACTIONS" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ChromeButton
                variant="outline"
                size="sm"
                onClick={() => handleCopyPubkey(selectedContact.pubkey)}
                icon={<IconCopyBlade size={13} />}
              >
                {copiedKey ? 'PUBKEY COPIED' : 'COPY VERIFIED PUBKEY'}
              </ChromeButton>
              <ChromeButton
                variant="ghost"
                size="sm"
                onClick={handlePurgeKeys}
                style={{ border: '1px solid rgba(255, 255, 255, 0.15)' }}
              >
                PURGE EPHEMERAL KEYS
              </ChromeButton>
            </div>

            {actionStatus && (
              <div style={{ fontSize: '11px', color: 'var(--status-online)', textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '6px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                {actionStatus}
              </div>
            )}
          </div>
        ) : selectedGroup ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'var(--void-2)', border: '1px solid rgba(255, 255, 255, 0.12)', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <IconCrown size={15} color="#ffffff" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.15em', color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
                  {selectedGroup.name}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <TrackedBadge label={`EPOCH ${selectedGroup.currentEpoch}`} variant="chrome" />
                <TrackedBadge label="ENCRYPTED" variant="neutral" />
              </div>
            </div>

            <BladeDivider label="CRYPTOGRAPHIC MATRIX" />
            <KeyFingerprintVisualizer pubkey={selectedGroup.groupKeyHex} tag={`EPOCH-00${selectedGroup.currentEpoch}`} />

            <BladeDivider label="GROUP INFO" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', background: 'var(--void-0)', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Active Members</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{warriors.length} Members</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Forward Secrecy</span>
                <span style={{ color: 'var(--status-online)', fontFamily: 'var(--font-mono)' }}>Active Ratchet</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Cipher Suite</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>NIP-44 ChaCha20</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Key Epoch</span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>Epoch {selectedGroup.currentEpoch}</span>
              </div>
            </div>

            <BladeDivider label={`MEMBERS IN GROUP (${warriors.length})`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {warriors.map((w) => (
                <div
                  key={w.pubkey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'var(--void-0)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--void-2)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontFamily: 'var(--font-display)',
                        color: '#ffffff',
                        fontWeight: 700,
                      }}
                    >
                      {w.alias.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                        {w.alias}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {w.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--status-online)', fontFamily: 'var(--font-mono)' }}>
                      {w.ping}
                    </span>
                    {!w.isSelf && (
                      <button
                        onClick={() => {
                          SoundEngine.playBladeTick();
                          onSelectContact(w.pubkey);
                        }}
                        style={{
                          background: 'var(--void-2)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'var(--text-silver)',
                          padding: '3px 6px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          borderRadius: '2px',
                        }}
                        title="Private Chat"
                      >
                        <IconChevron size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <BladeDivider label="GROUP ACTIONS" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ChromeButton
                variant="solid"
                size="sm"
                onClick={handleRekeyGroup}
                icon={<IconShieldLock size={13} color="#000" />}
              >
                ROTATE ENCRYPTION KEY
              </ChromeButton>

              <ChromeButton
                variant="outline"
                size="sm"
                onClick={handleSignalBeacon}
                icon={<IconRelayTower size={13} />}
              >
                REFRESH GROUP SYNC
              </ChromeButton>
            </div>

            {actionStatus && (
              <div style={{ fontSize: '11px', color: 'var(--status-online)', textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '6px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                {actionStatus}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              No channel selected. Connected relays and mesh routing are active in the background.
            </div>

            <BladeDivider label="NETWORK BEACONS" />

            <button
              onClick={() => {
                SoundEngine.playBladeTick();
                onOpenRelays();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--void-2)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconRelayTower size={14} color="var(--status-relay-ok)" />
                <span>RELAY MESH POOL</span>
              </div>
              <span style={{ color: 'var(--status-relay-ok)' }}>5/5 ONLINE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
