import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Sparkles, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

import logoImg from '@/assets/logo.png';

export const AuthModal: React.FC = () => {
  const { createAccount, importAccount } = useAuthStore();
  const [mode, setMode] = useState<'welcome' | 'create' | 'import'>('welcome');
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
            Serverless • Censorship-Resistant • Gamer HUD
          </p>
        </div>

        {mode === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setMode('create')}
              className="cyber-button"
              style={{ padding: '14px', fontSize: '15px', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="var(--accent-cyan)" />
                <span>Create New Identity</span>
              </div>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setMode('import')}
              className="cyber-button"
              style={{ padding: '14px', fontSize: '15px', justifyContent: 'space-between', background: 'transparent', borderColor: 'var(--border-subtle)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={18} color="var(--accent-purple)" />
                <span>Restore with 12-Word Seed</span>
              </div>
              <ArrowRight size={18} />
            </button>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              No phone numbers • No email • No central servers
            </div>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Choose Your Gamer Handle
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Viper, Shadow, Neon"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                className="cyber-input"
                style={{ width: '100%', fontSize: '15px' }}
                autoFocus
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                A 4-char cryptographic fingerprint (e.g. #3f8a) will be attached automatically.
              </span>
            </div>

            <button type="submit" className="cyber-button" style={{ padding: '12px', fontSize: '15px', marginTop: '6px' }}>
              Generate Seed & Launch
            </button>

            <button
              type="button"
              onClick={() => setMode('welcome')}
              className="cyber-button"
              style={{ background: 'transparent', borderColor: 'transparent', color: 'var(--text-muted)', fontSize: '13px' }}
            >
              Back
            </button>
          </form>
        )}

        {mode === 'import' && (
          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Gamer Handle
              </label>
              <input
                type="text"
                placeholder="e.g. Viper"
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

            <button type="submit" className="cyber-button" style={{ padding: '12px', fontSize: '15px' }}>
              Restore Identity
            </button>

            <button
              type="button"
              onClick={() => setMode('welcome')}
              className="cyber-button"
              style={{ background: 'transparent', borderColor: 'transparent', color: 'var(--text-muted)', fontSize: '13px' }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
