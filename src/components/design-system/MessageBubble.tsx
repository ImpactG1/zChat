import React, { useState } from 'react';
import { IconCheckDouble, IconShieldLock, IconTimerSand } from '@/components/icons/RazorIcons';

export interface MessageReaction {
  sigil: string;
  count: number;
  userReacted?: boolean;
}

export interface MessageBubbleProps {
  id: string;
  content: string;
  timestamp: number;
  isSelf: boolean;
  senderName?: string;
  senderTag?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
  disappearingTimer?: string;
  replyTo?: {
    senderName: string;
    content: string;
  };
  reactions?: MessageReaction[];
  onReact?: (sigil: string) => void;
  onReply?: () => void;
  voiceNoteDuration?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  timestamp,
  isSelf,
  senderName,
  senderTag,
  status = 'delivered',
  disappearingTimer,
  replyTo,
  reactions = [],
  onReact,
  onReply,
}) => {
  const [showSigilMenu, setShowSigilMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const availableSigils = ['⚔', '◆', '🛡', '✦'];

  return (
    <div
      className="anim-slice-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSelf ? 'flex-end' : 'flex-start',
        margin: '6px 0',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Quick Action Micro-Bar on Hover */}
      {isHovered && !showSigilMenu && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            right: isSelf ? '8px' : 'auto',
            left: isSelf ? 'auto' : '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'var(--void-1)',
            border: '1px solid rgba(255, 255, 255, 0.28)',
            borderRadius: '2px',
            padding: '2px 4px',
            zIndex: 15,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.9)',
          }}
        >
          {availableSigils.slice(0, 2).map((sigil) => (
            <button
              key={sigil}
              onClick={() => onReact?.(sigil)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '1px 3px',
              }}
              title={`React with ${sigil}`}
            >
              {sigil}
            </button>
          ))}
          {onReply && (
            <button
              onClick={onReply}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-silver)',
                cursor: 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.1em',
                padding: '1px 4px',
              }}
              title="Reply to message"
            >
              REPLY
            </button>
          )}
        </div>
      )}
      {/* Sender Header for Incoming Group/Direct Messages */}
      {!isSelf && senderName && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
            marginLeft: '4px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              fontWeight: 700,
              color: 'var(--text-silver)',
              textTransform: 'uppercase',
            }}
          >
            {senderName}
          </span>
          {senderTag && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              {senderTag}
            </span>
          )}
          <IconShieldLock size={11} color="var(--status-encrypted)" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        onDoubleClick={() => setShowSigilMenu(!showSigilMenu)}
        style={{
          position: 'relative',
          maxWidth: '82%',
          minWidth: '120px',
          padding: '10px 14px',
          background: isSelf ? 'var(--void-3)' : 'var(--void-2)',
          border: isSelf
            ? '1px solid rgba(255, 255, 255, 0.22)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          clipPath: isSelf
            ? 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
            : 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
          boxShadow: isSelf
            ? '0 2px 14px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(255, 255, 255, 0.02)'
            : '0 2px 14px rgba(0, 0, 0, 0.6)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {/* Specular Edge Highlight Sliver on Outgoing */}
        {isSelf && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '10px',
              bottom: '10px',
              width: '2px',
              background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Quoted Reply Excerpt if applicable */}
        {replyTo && (
          <div
            style={{
              borderLeft: '2px solid rgba(255, 255, 255, 0.4)',
              paddingLeft: '8px',
              marginBottom: '8px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.03)',
              paddingTop: '2px',
              paddingBottom: '2px',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-silver)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
              {replyTo.senderName}
            </div>
            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {replyTo.content}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body)',
            lineHeight: 1.5,
            color: 'var(--text-white)',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            whiteSpace: 'pre-wrap',
            userSelect: 'text',
          }}
        >
          {content}
        </div>

        {/* Meta Bar: Timestamp, Disappearing Timer, Delivery Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            marginTop: '4px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          {disappearingTimer && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: 'var(--status-warning)',
              }}
              title="Disappearing message timer active"
            >
              <IconTimerSand size={10} color="var(--status-warning)" />
              {disappearingTimer}
            </span>
          )}

          <span>{formatTime(timestamp)}</span>

          {isSelf && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <IconCheckDouble
                size={12}
                color={status === 'delivered' ? 'var(--status-online)' : 'var(--text-muted)'}
              />
            </span>
          )}
        </div>
      </div>

      {/* Engraved Sigil Reactions */}
      {reactions.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px',
            marginLeft: isSelf ? 0 : '8px',
            marginRight: isSelf ? '8px' : 0,
          }}
        >
          {reactions.map((r, i) => (
            <button
              key={i}
              onClick={() => onReact?.(r.sigil)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                background: r.userReacted ? 'rgba(255, 255, 255, 0.15)' : 'var(--void-1)',
                border: `1px solid ${r.userReacted ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '10px',
                color: r.userReacted ? '#ffffff' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{r.sigil}</span>
              <span>{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Floating Sigil Reaction Bar Menu on Double Click */}
      {showSigilMenu && (
        <div
          className="chrome-border"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            marginTop: '4px',
            background: 'var(--void-3)',
            borderRadius: '2px',
            zIndex: 10,
          }}
        >
          {availableSigils.map((sigil) => (
            <button
              key={sigil}
              onClick={() => {
                onReact?.(sigil);
                setShowSigilMenu(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-white)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 6px',
                transition: 'transform var(--transition-fast)',
              }}
            >
              {sigil}
            </button>
          ))}
          {onReply && (
            <button
              onClick={() => {
                onReply();
                setShowSigilMenu(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-silver)',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.15em',
                padding: '4px 6px',
              }}
            >
              REPLY
            </button>
          )}
        </div>
      )}
    </div>
  );
};
