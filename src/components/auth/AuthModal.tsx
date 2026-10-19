import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Sparkles, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import logoImg from '@/assets/logo.png';

export const AuthModal: React.FC = () => {
  const { createAccount, importAccount } = useAuthStore();
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [handleInput, setHandleInput] = useState('');
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = handleInput.trim() || 'Gamer';
    createAccount(handle);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const words = mnemonicInput.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setErrorMsg('Mnemonic must contain 12 (or 24) words.');
      return;
    }
    try {
      importAccount(mnemonicInput.trim(), handleInput.trim() || 'Gamer');
    } catch {
      setErrorMsg('Invalid mnemonic seed phrase.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
      {/* Background glow effects */}
      <div style={{ position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-cyan-glow), transparent 70%)', top: '10%', left: '15%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-purple-glow), transparent 70%)', bottom: '10%', right: '15%', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '440px', padding: '28px', position: 'relative' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '84px',
              height: '84px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '2px solid var(--border-glow)',
              boxShadow: '0 0 28px var(--accent-cyan-glow)',
              background: '#04060a',
              marginBottom: '16px',
            }}
          >
            <img
              src={logoImg}
              alt="zChat Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>
            zChat
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Serverless • Direct P2P Mesh • Gamer HUD
          </p>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Choose Your Gamer Tag
              </label>
              <input
                type="text"
                required
                placeholder="e.g. zMayank, Viper, Ghost"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                className="cyber-input"
                style={{ width: '100%', fontSize: '16px', fontWeight: 600 }}
                autoFocus
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Your cryptographic keys and session vault are initialized automatically.
              </span>
            </div>

            <button
              type="submit"
              className="cyber-button"
              style={{
                padding: '12px',
                fontSize: '15px',
                marginTop: '6px',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                color: '#fff',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} />
              <span>Launch zChat HUD</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('import')}
              className="cyber-button"
              style={{ background: 'transparent', borderColor: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', justifyContent: 'center' }}
            >
              <KeyRound size={14} color="var(--accent-purple)" />
              <span>Have an existing 12-word seed? Restore</span>
            </button>

            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              Zero servers • Direct encrypted peer-to-peer
            </div>
          </form>
        ) : (
          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Gamer Tag
              </label>
              <input
                type="text"
                placeholder="e.g. zMayank"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                className="cyber-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                12-Word Seed Phrase
              </label>
              <textarea
                required
                rows={3}
                placeholder="twelve secret words separated by spaces..."
                value={mnemonicInput}
                onChange={(e) => setMnemonicInput(e.target.value)}
                className="cyber-input"
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'none' }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                {errorMsg}
              </div>
            )}

            <button type="submit" className="cyber-button" style={{ padding: '12px', fontSize: '15px', justifyContent: 'center' }}>
              <span>Restore Identity</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => setMode('create')}
              className="cyber-button"
              style={{ background: 'transparent', borderColor: 'transparent', color: 'var(--text-muted)', fontSize: '13px', justifyContent: 'center' }}
            >
              Back to Create
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
