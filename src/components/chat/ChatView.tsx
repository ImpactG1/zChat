import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { sendDirectMessage } from '@/core/nostr/messageSender';
import { useAuthStore } from '@/stores/useAuthStore';
import { MessageBubble } from '@/components/design-system/MessageBubble';
import { VoiceWaveformRazor } from '@/components/design-system/VoiceWaveformRazor';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import {
  IconShieldLock,
  IconBladeSend,
  IconChevron,
  IconVoiceMic,
  IconTimerSand,
  IconCopyBlade,
  IconClose,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface ChatViewProps {
  contactPubkey: string;
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ contactPubkey, onBack }) => {
  const { identity } = useAuthStore();

  // Load contact dynamically from DB
  const contact = useLiveQuery(
    () => db.contacts.get(contactPubkey),
    [contactPubkey]
  );

  // Load messages dynamically from DB
  const messages = useLiveQuery(
    () => db.messages.where('conversationId').equals(contactPubkey).sortBy('timestamp'),
    [contactPubkey]
  ) ?? [];

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showVoiceNote, setShowVoiceNote] = useState(false);
  const [disappearingTimer, setDisappearingTimer] = useState<'off' | '1h' | '24h' | '7d'>('24h');
  const [replyTarget, setReplyTarget] = useState<{ senderName: string; content: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count when opening
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
    SoundEngine.playBladeTick();

    try {
      await sendDirectMessage(contactPubkey, text);
    } catch (err) {
      console.error('Failed to dispatch message:', err);
    } finally {
      setIsSending(false);
      setReplyTarget(null);
    }
  };

  const copyPubkey = () => {
    navigator.clipboard.writeText(contactPubkey);
    SoundEngine.playBladeTick();
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const cycleTimer = () => {
    SoundEngine.playBladeTick();
    const sequence: ('off' | '1h' | '24h' | '7d')[] = ['off', '1h', '24h', '7d'];
    const nextIdx = (sequence.indexOf(disappearingTimer) + 1) % sequence.length;
    setDisappearingTimer(sequence[nextIdx]);
  };

  if (!contact) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--void-0)' }}>
        <p className="tracked-micro">LOCATING WHISPER CHANNEL...</p>
      </div>
    );
  }

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
      {/* Blade Chat Header */}
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
                {contact.alias}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {contact.tag}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <IconShieldLock size={11} color="var(--status-encrypted)" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                CHACHA20-POLY1305 E2EE
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Disappearing Timer Toggle */}
          <button
            onClick={cycleTimer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: disappearingTimer !== 'off' ? 'rgba(153, 115, 62, 0.15)' : 'var(--void-2)',
              border: `1px solid ${disappearingTimer !== 'off' ? 'rgba(153, 115, 62, 0.45)' : 'rgba(255, 255, 255, 0.12)'}`,
              color: disappearingTimer !== 'off' ? 'var(--status-warning)' : 'var(--text-muted)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
            title="Disappearing Timer"
          >
            <IconTimerSand size={11} color={disappearingTimer !== 'off' ? 'var(--status-warning)' : 'var(--text-muted)'} />
            <span>{disappearingTimer.toUpperCase()}</span>
          </button>

          {/* Copy Public Key */}
          <button
            onClick={copyPubkey}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'var(--void-2)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: copiedKey ? '#ffffff' : 'var(--text-silver)',
              fontSize: '10px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
            title="Copy Public Key"
          >
            <IconCopyBlade size={11} />
            <span>{copiedKey ? 'COPIED' : 'KEY'}</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
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
        {/* Encryption Assurance Notice */}
        <div
          style={{
            textAlign: 'center',
            padding: '12px 16px',
            margin: '8px auto 12px',
            maxWidth: '380px',
            background: 'var(--void-1)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <IconShieldLock size={12} color="var(--status-encrypted)" />
            <span className="tracked-micro" style={{ color: 'var(--text-silver)' }}>
              END-TO-END ENCRYPTED WHISPER
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Payloads are gift-wrapped with ephemeral Diffie-Hellman keys. No relay or third party can observe content or metadata.
          </p>
        </div>

        {/* Message Stream */}
        {messages.map((msg) => {
          const isSelf = msg.senderPubkey === identity?.pubkey;
          return (
            <MessageBubble
              key={msg.id}
              id={msg.id}
              content={msg.content}
              timestamp={msg.timestamp}
              isSelf={isSelf}
              senderName={isSelf ? undefined : contact.alias}
              senderTag={isSelf ? undefined : contact.tag}
              status={msg.status}
              disappearingTimer={disappearingTimer !== 'off' ? `23h 59m` : undefined}
              onReply={() => {
                setReplyTarget({
                  senderName: isSelf ? 'You' : contact.alias,
                  content: msg.content,
                });
              }}
              reactions={
                msg.id === messages[0]?.id
                  ? [{ sigil: '⚔', count: 2, userReacted: true }, { sigil: '◆', count: 1 }]
                  : []
              }
            />
          );
        })}

        {/* Voice Note Demonstration */}
        {showVoiceNote && (
          <div style={{ alignSelf: 'flex-start', margin: '4px 0' }}>
            <VoiceWaveformRazor durationSeconds={28} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Reply Preview Bar if active */}
      {replyTarget && (
        <div
          style={{
            margin: '0 12px',
            padding: '8px 12px',
            background: 'var(--void-1)',
            borderLeft: '2px solid #ffffff',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
              REPLYING TO {replyTarget.senderName.toUpperCase()}:
            </span>{' '}
            <span style={{ fontStyle: 'italic' }}>"{replyTarget.content.slice(0, 50)}..."</span>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <IconClose size={13} />
          </button>
        </div>
      )}

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
          { label: '⚔ PERIMETER OK', text: 'Perimeter verified. Awaiting coordinate confirmation.' },
          { label: '✦ KEY VERIFIED', text: 'Key fingerprint matches sanctum matrix. Channel secure.' },
          { label: '🛡 SILENT PROTOCOL', text: 'Engaging silent protocol. Relay traffic minimized.' },
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
                setInputMessage(item.text);
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
        {/* Voice Dispatch Toggle */}
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

        {/* Message Input */}
        <div style={{ flex: 1 }}>
          <BladeInput
            placeholder={`Seal whisper for ${contact.alias}${contact.tag}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{ height: '42px' }}
          />
        </div>

        {/* Solid Chrome Send Button */}
        <ChromeButton
          variant="solid"
          size="md"
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          icon={<IconBladeSend size={15} color="#000" />}
          style={{ height: '42px', minHeight: '42px', padding: '0 16px' }}
        >
          SEAL
        </ChromeButton>
      </form>
    </div>
  );
};
