import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { KeyRound, Copy, Check, X, AlertTriangle, LogOut } from 'lucide-react';

interface SeedBackupModalProps {
  onClose: () => void;
}

export const SeedBackupModal: React.FC<SeedBackupModalProps> = ({ onClose }) => {
  const { identity, logout } = useAuthStore();
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [copiedPubkey, setCopiedPubkey] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!identity) return null;

  const words = identity.mnemonic?.split(' ') || [];

  const copySeed = () => {
    if (!identity.mnemonic) return;
    navigator.clipboard.writeText(identity.mnemonic);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const copyPubkey = () => {
    navigator.clipboard.writeText(identity.npub);
    setCopiedPubkey(true);
    setTimeout(() => setCopiedPubkey(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
      <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Identity & Seed Phrase</h3>
          </div>
          <button
            onClick={onClose}
            className="cyber-button"
            style={{ padding: '6px', background: 'transparent', borderColor: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Public Identity */}
        <div className="glass-panel" style={{ padding: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Your Shareable ID (npub)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={identity.npub}
              className="cyber-input"
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '6px 10px' }}
            />
            <button onClick={copyPubkey} className="cyber-button" style={{ padding: '6px 10px', fontSize: '12px' }}>
              {copiedPubkey ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* 12-Word Seed Grid */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>12-Word Recovery Seed</span>
            <button
              onClick={copySeed}
              className="cyber-button"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {copiedSeed ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              {copiedSeed ? 'Copied' : 'Copy All'}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {words.map((word, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  padding: '4px 6px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '4px',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{idx + 1}.</span>
                <span style={{ fontWeight: 600 }}>{word}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning alert */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--accent-amber)',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Keep your seed phrase offline and secret.</strong> Anyone with these 12 words can impersonate your gamer ID and decrypt your messages. There are no password resets.
          </div>
        </div>

        {/* Logout / Switch Profile */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          {showConfirmLogout ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent-rose)' }}>Clear key from device?</span>
              <button
                onClick={() => { logout(); onClose(); }}
                className="cyber-button"
                style={{ padding: '6px 12px', background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="cyber-button"
                style={{ padding: '6px 10px', background: 'transparent' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmLogout(true)}
              className="cyber-button"
              style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)', background: 'transparent' }}
            >
              <LogOut size={14} />
              Reset / Switch Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
