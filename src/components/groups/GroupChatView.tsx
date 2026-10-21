import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { GroupManager } from '@/core/groups/groupManager';
import { useAuthStore } from '@/stores/useAuthStore';
import { MockService } from '@/services/mockDataService';
import { MessageBubble } from '@/components/design-system/MessageBubble';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import { TrackedBadge } from '@/components/design-system/TrackedBadge';
import { VoiceWaveformRazor } from '@/components/design-system/VoiceWaveformRazor';
import {
  IconShieldLock,
  IconBladeSend,
  IconChevron,
  IconCrown,
  IconKeyVault,
  IconClose,
  IconVoiceMic,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface GroupChatViewProps {
  groupId: string;
  onBack: () => void;
}

export const GroupChatView: React.FC<GroupChatViewProps> = ({ groupId, onBack }) => {
  const { identity } = useAuthStore();

  const group = useLiveQuery(async () => {
    const g = await db.groups.get(groupId);
    if (g) return g;
    return MockService.getGroups().find((item) => item.id === groupId);
  }, [groupId]) ?? MockService.getGroups().find((item) => item.id === groupId);

  const dbMessages = useLiveQuery(
    () => db.groupMessages.where('groupId').equals(groupId).sortBy('timestamp'),
    [groupId]
  ) ?? [];

  const mockMessages = MockService.getGroupMessages(groupId);
  const messages = dbMessages.length > 0 ? dbMessages : mockMessages;

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showVoiceNote, setShowVoiceNote] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    SoundEngine.playBladeTick();

    try {
      await GroupManager.sendGroupMessage(groupId, text);
      MockService.sendGroupMessage(groupId, text);
    } catch {
      MockService.sendGroupMessage(groupId, text);
    } finally {
      setIsSending(false);
    }
  };

  const handleRotateKey = async () => {
    setIsRotating(true);
    SoundEngine.playSealChime();
    try {
      await GroupManager.rotateGroupKey(groupId);
    } catch {
      // simulate in mock service
      if (group) group.currentEpoch += 1;
    } finally {
      setIsRotating(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`https://zenyth.chat/join?sanctum=${groupId}`);
    setCopiedInvite(true);
    SoundEngine.playBladeTick();
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  if (!group) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--void-0)' }}>
        <p className="tracked-micro">LOCATING SANCTUM...</p>
      </div>
    );
  }

  const isLeader = group.adminPubkey === identity?.pubkey;

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
      {/* Blade Group Header */}
      <div
        style={{
          margin: '0 12px 6px',
          padding: '10px 14px',
          background: 'var(--void-1)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
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
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                {group.name}
              </span>
              <TrackedBadge label={`EPOCH ${group.currentEpoch}`} variant="chrome" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {group.members.length} Warriors in Sanctum
              </span>
              {isLeader && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--status-warning)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  <IconCrown size={11} color="var(--status-warning)" />
                  VANGUARD LEADER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Group Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isLeader && (
            <button
              onClick={handleRotateKey}
              disabled={isRotating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: 'var(--void-2)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-silver)',
                fontSize: '10px',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.12em',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
              title="Rotate Symmetric Key (Forward Secrecy)"
            >
              <IconKeyVault size={12} />
              <span>{isRotating ? 'ROTATING...' : 'ROTATE KEY'}</span>
            </button>
          )}

          <ChromeButton
            variant="solid"
            size="sm"
            onClick={() => setShowInviteModal(true)}
            style={{ padding: '4px 10px', minHeight: '32px' }}
          >
            INVITE
          </ChromeButton>
        </div>
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
        <div
          style={{
            textAlign: 'center',
            padding: '10px 14px',
            margin: '6px auto 10px',
            maxWidth: '380px',
            background: 'var(--void-1)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
            <IconShieldLock size={12} color="var(--status-encrypted)" />
            <span className="tracked-micro" style={{ color: 'var(--text-silver)' }}>
              SANCTUM SYMMETRIC RATCHET
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
            Every transmission is sealed with Epoch {group.currentEpoch} shared key. Key rotations provide forward secrecy.
          </p>
        </div>

        {messages.map((msg) => {
          const isSelf = msg.senderPubkey === identity?.pubkey;
          return (
            <MessageBubble
              key={msg.id}
              id={msg.id}
              content={msg.content}
              timestamp={msg.timestamp}
              isSelf={isSelf}
              senderName={isSelf ? undefined : 'Warrior'}
              senderTag={isSelf ? undefined : msg.senderTag}
              status={msg.status}
              reactions={
                msg.id === messages[0]?.id
                  ? [{ sigil: '⚔', count: 3, userReacted: true }, { sigil: '✦', count: 2 }]
                  : []
              }
            />
          );
        })}

        {/* Voice Note Demonstration */}
        {showVoiceNote && (
          <div style={{ alignSelf: 'flex-start', margin: '6px 0' }}>
            <VoiceWaveformRazor durationSeconds={32} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Tactical Order Shortcuts */}
      <div
        style={{
          padding: '6px 12px 2px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          background: 'var(--void-0)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {[
          { label: '⚔ PERIMETER SECURE', text: '[REPORT] Defensive perimeter secure. All 4 nodes operational.' },
          { label: '✦ RATCHET ROTATION', action: handleRotateKey },
          { label: '🛡 FORM SHIELD', text: '[TACTICAL] Lock communications. Awaiting next epoch cipher.' },
          { label: '🎙 VOICE DISPATCH', action: () => setShowVoiceNote((v) => !v) },
        ].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              SoundEngine.playBladeTick();
              if (item.action) {
                item.action();
              } else if (item.text) {
                setInputText(item.text);
              }
            }}
            style={{
              padding: '3px 8px',
              background: 'var(--void-2)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-silver)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              borderRadius: '2px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Composer Input Bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '8px 12px 12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: 'var(--void-0)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            SoundEngine.playBladeTick();
            setShowVoiceNote(!showVoiceNote);
          }}
          style={{
            width: '42px',
            height: '42px',
            background: showVoiceNote ? 'rgba(255, 255, 255, 0.18)' : 'var(--void-1)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: showVoiceNote ? '#ffffff' : 'var(--text-silver)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            flexShrink: 0,
          }}
          title="Toggle Voice Dispatch"
        >
          <IconVoiceMic size={16} />
        </button>

        <div style={{ flex: 1 }}>
          <BladeInput
            placeholder={`Broadcast order to ${group.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ height: '42px' }}
          />
        </div>

        <ChromeButton
          variant="solid"
          size="md"
          type="submit"
          disabled={!inputText.trim() || isSending}
          icon={<IconBladeSend size={15} color="#000" />}
          style={{ height: '42px', minHeight: '42px', padding: '0 16px' }}
        >
          BROADCAST
        </ChromeButton>
      </form>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div
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
              <span className="tracked-micro">INVITATION COVENANT</span>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <IconClose size={14} />
              </button>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.18em', color: '#ffffff', textTransform: 'uppercase', margin: 0 }}>
              INVITE TO {group.name}
            </h3>

            <div
              style={{
                background: 'var(--void-0)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-silver)',
                wordBreak: 'break-all',
              }}
            >
              https://zenyth.chat/join?sanctum={groupId}
            </div>

            <ChromeButton variant="solid" size="md" onClick={copyInviteLink}>
              {copiedInvite ? 'LINK COPIED' : 'COPY INVITATION LINK'}
            </ChromeButton>
          </div>
        </div>
      )}
    </div>
  );
};
