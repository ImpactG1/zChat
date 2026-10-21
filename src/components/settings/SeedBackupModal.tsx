import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { KeyFingerprintVisualizer } from '@/components/design-system/KeyFingerprintVisualizer';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeDivider } from '@/components/design-system/BladeDivider';
import {
  IconShieldLock,
  IconCopyBlade,
  IconClose,
  IconTrashFlame,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface SeedBackupModalProps {
  onClose: () => void;
}

export const SeedBackupModal: React.FC<SeedBackupModalProps> = ({ onClose }) => {
  const { identity, logout } = useAuthStore();
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [copiedNpub, setCopiedNpub] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!identity) return null;

  const words = identity.mnemonic?.split(' ') || [];

  const copySeed = () => {
    if (!identity.mnemonic) return;
    navigator.clipboard.writeText(identity.mnemonic);
    SoundEngine.playBladeTick();
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const copyNpub = () => {
    navigator.clipboard.writeText(identity.npub);
    SoundEngine.playBladeTick();
    setCopiedNpub(true);
    setTimeout(() => setCopiedNpub(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 100,
      }}
    >
      <div
        className="anim-slice-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--void-1)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          padding: '24px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.95)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconShieldLock size={18} color="var(--status-encrypted)" />
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                letterSpacing: '0.2em',
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              IDENTITY & VAULT
            </h3>
          </div>
          <button
            onClick={() => {
              SoundEngine.playBladeTick();
              onClose();
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Visualized Cryptographic Fingerprint */}
        <div style={{ marginBottom: '20px' }}>
          <KeyFingerprintVisualizer pubkey={identity.pubkey} tag={identity.tag} />
        </div>

        {/* Public Identity npub */}
        <div
          style={{
            background: 'var(--void-2)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '2px',
          }}
        >
          <div className="tracked-micro" style={{ marginBottom: '6px' }}>
            SHAREABLE WARRIOR COVENANT (NPUB)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={identity.npub}
              style={{
                flex: 1,
                background: 'var(--void-0)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-silver)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '6px 10px',
                outline: 'none',
              }}
            />
            <button
              onClick={copyNpub}
              style={{
                background: 'var(--void-3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '6px 10px',
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <IconCopyBlade size={11} />
              <span>{copiedNpub ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>

        <BladeDivider label="12 RUNES OF RECALL" />

        {/* 12 Runes Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginBottom: '16px',
          }}
        >
          {words.map((w, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--void-2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>
                {w}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={copySeed}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: copiedSeed ? 'var(--status-online)' : 'var(--text-silver)',
              padding: '6px 14px',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconCopyBlade size={12} />
            <span>{copiedSeed ? 'RUNES COPIED' : 'COPY ALL 12 RUNES'}</span>
          </button>
        </div>

        {/* Logout / Sever Identity */}
        <BladeDivider label="DANGER ZONE" />

        {!showConfirmLogout ? (
          <ChromeButton
            variant="danger"
            size="md"
            onClick={() => setShowConfirmLogout(true)}
            icon={<IconTrashFlame size={14} color="#fca5a5" />}
            style={{ width: '100%' }}
          >
            INCINERATE LOCAL VAULT & LOGOUT
          </ChromeButton>
        ) : (
          <div
            style={{
              padding: '12px',
              background: 'rgba(139, 52, 52, 0.15)',
              border: '1px solid rgba(139, 52, 52, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.4 }}>
              Are you certain? Ensure you have secured your 12 runes. All local keys will be permanently purged.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <ChromeButton variant="ghost" size="sm" onClick={() => setShowConfirmLogout(false)}>
                ABORT
              </ChromeButton>
              <ChromeButton
                variant="danger"
                size="sm"
                onClick={() => {
                  SoundEngine.playBladeTick();
                  logout();
                  onClose();
                }}
              >
                CONFIRM PURGE
              </ChromeButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
