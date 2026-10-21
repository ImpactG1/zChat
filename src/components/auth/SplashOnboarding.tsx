import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { createNewIdentity } from '@/core/crypto/keys';
import { UserIdentity } from '@/types';
import { EmblemLogo } from '@/components/common/EmblemLogo';
import { FogCanvas } from '@/components/design-system/FogCanvas';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import { BladeDivider } from '@/components/design-system/BladeDivider';
import { KeyFingerprintVisualizer } from '@/components/design-system/KeyFingerprintVisualizer';
import {
  IconShieldLock,
  IconBladeSend,
  IconCopyBlade,
  IconKeyVault,
  IconChevron,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

export const SplashOnboarding: React.FC = () => {
  const { importAccount, setIdentity } = useAuthStore();

  // Steps: 'intro' | 'forge' | 'runes' | 'recall'
  const [step, setStep] = useState<'intro' | 'forge' | 'runes' | 'recall'>('intro');
  const [handle, setHandle] = useState('Vanguard');
  const [forgedIdentity, setForgedIdentity] = useState<UserIdentity | null>(null);
  const [revealedRunes, setRevealedRunes] = useState<number[]>([]);
  const [copiedRunes, setCopiedRunes] = useState(false);
  const [recallMnemonic, setRecallMnemonic] = useState('');
  const [recallError, setRecallError] = useState('');
  const [isForging, setIsForging] = useState(false);

  // Generate identity on entering 'forge' step
  useEffect(() => {
    if (step === 'forge' && !forgedIdentity) {
      setIsForging(true);
      const timer = setTimeout(() => {
        const id = createNewIdentity(handle || 'Vanguard');
        setForgedIdentity(id);
        setIsForging(false);
        SoundEngine.playBladeTick();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, handle, forgedIdentity]);

  const handleStartForge = () => {
    SoundEngine.playBladeTick();
    setStep('forge');
  };

  const handleProceedToRunes = () => {
    if (!forgedIdentity) return;
    SoundEngine.playBladeTick();
    setStep('runes');
    // Reveal runes sequentially with blade ticks
    const wordsCount = forgedIdentity.mnemonic?.split(' ').length || 12;
    for (let i = 0; i < wordsCount; i++) {
      setTimeout(() => {
        setRevealedRunes((prev) => [...prev, i]);
        SoundEngine.playBladeTick();
      }, 100 * (i + 1));
    }
  };

  const handleCopyAllRunes = () => {
    if (!forgedIdentity?.mnemonic) return;
    navigator.clipboard.writeText(forgedIdentity.mnemonic);
    setCopiedRunes(true);
    SoundEngine.playBladeTick();
    setTimeout(() => setCopiedRunes(false), 2500);
  };

  const handleSealAndEnter = () => {
    if (!forgedIdentity) return;
    SoundEngine.playSealChime();
    setIdentity(forgedIdentity);
  };

  const handleRecallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecallError('');
    const words = recallMnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setRecallError('The recall covenant requires exactly 12 runes.');
      return;
    }
    try {
      SoundEngine.playSealChime();
      importAccount(recallMnemonic.trim(), handle || 'Vanguard');
    } catch {
      setRecallError('Invalid cryptographic covenant. Runes rejected.');
    }
  };

  const runeWords = forgedIdentity?.mnemonic?.split(' ') || [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--void-0)',
        color: 'var(--text-white)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Background Volumetric Mist */}
      <FogCanvas density="high" />

      {/* Ghosted Giant Monolithic Typography in Background */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(64px, 14vw, 180px)',
          letterSpacing: '0.3em',
          fontWeight: 900,
          color: 'rgba(255, 255, 255, 0.02)',
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 0,
        }}
      >
        ZENYTH
      </div>

      {/* Foreground Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* STEP 1: INTRO / SPLASH */}
        {step === 'intro' && (
          <div
            className="anim-slice-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {/* Liquid Chrome Emblem (Real Logo) */}
            <div style={{ marginBottom: '28px', position: 'relative' }}>
              <EmblemLogo size={132} />
            </div>

            {/* Monolithic Display Title */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 6vw, 38px)',
                letterSpacing: '0.28em',
                fontWeight: 800,
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: 0,
                textShadow: '0 2px 20px rgba(255, 255, 255, 0.25)',
              }}
            >
              ZENYTH
            </h1>

            {/* Subtitle & Tracked Micro-Label */}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                letterSpacing: '0.35em',
                color: 'var(--chrome-sheen)',
                textTransform: 'uppercase',
                marginTop: '6px',
                fontWeight: 600,
              }}
            >
              DUELING GROUNDS
            </div>

            <BladeDivider style={{ margin: '22px 0 16px' }} />

            <div
              className="tracked-micro"
              style={{
                fontSize: '11px',
                letterSpacing: '0.25em',
                color: 'var(--text-secondary)',
                marginBottom: '36px',
              }}
            >
              MORE THAN A CLAN ◆ COMPETE ◆ IMPROVE ◆ BELONG
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
              <ChromeButton
                variant="solid"
                size="lg"
                onClick={handleStartForge}
                icon={<IconBladeSend size={15} color="#000" />}
              >
                ENTER THE GROUNDS
              </ChromeButton>

              <ChromeButton
                variant="outline"
                size="md"
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setStep('recall');
                }}
                icon={<IconKeyVault size={14} color="#fff" />}
              >
                RECALL SANCTUM
              </ChromeButton>
            </div>

            {/* Bottom Security Note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '44px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              <IconShieldLock size={12} color="var(--status-encrypted)" />
              <span>SERVERLESS ◆ SECP256K1 ENCRYPTED ◆ ZERO LOGS</span>
            </div>
          </div>
        )}

        {/* STEP 2: FORGE IDENTITY */}
        {step === 'forge' && (
          <div
            className="anim-slice-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              background: 'var(--void-1)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              padding: '28px 24px',
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Top Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
              <button
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setStep('intro');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                }}
              >
                <IconChevron size={14} direction="left" />
                <span>BACK</span>
              </button>

              <span className="tracked-micro">RITUAL PHASE I</span>
            </div>

            <EmblemLogo size={48} />

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                letterSpacing: '0.22em',
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: '12px 0 4px',
              }}
            >
              FORGE IDENTITY
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
              Anoint your battle tag. A unique cryptographic keypair and sigil matrix will be forged in pure mathematics.
            </p>

            {/* Handle Input */}
            <div style={{ width: '100%', marginBottom: '18px' }}>
              <BladeInput
                label="WARRIOR HANDLE"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  setForgedIdentity(null); // will trigger re-forge
                }}
                placeholder="e.g. Vanguard, Viper, Ghost"
                autoFocus
              />
            </div>

            {/* Live Keypair Visualizer */}
            {forgedIdentity ? (
              <div style={{ width: '100%', marginBottom: '20px' }}>
                <KeyFingerprintVisualizer
                  pubkey={forgedIdentity.pubkey}
                  tag={forgedIdentity.tag}
                  showCopy={false}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  letterSpacing: '0.25em',
                  color: 'var(--text-muted)',
                }}
              >
                IGNITING CRYPTOGRAPHIC VAULT...
              </div>
            )}

            <ChromeButton
              variant="solid"
              size="lg"
              onClick={handleProceedToRunes}
              disabled={isForging || !forgedIdentity}
              style={{ width: '100%' }}
            >
              REVEAL 12 RUNES OF RECALL
            </ChromeButton>
          </div>
        )}

        {/* STEP 3: THE 12 RUNES OF RECALL */}
        {step === 'runes' && forgedIdentity && (
          <div
            className="anim-slice-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              background: 'var(--void-1)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              padding: '24px',
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.9)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
              <span className="tracked-micro">RITUAL PHASE II</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--status-warning)' }}>
                ◆ SACRED RECALL
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                letterSpacing: '0.22em',
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: '4px 0',
              }}
            >
              12 RUNES OF RECALL
            </h2>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '18px', maxWidth: '420px' }}>
              Commit these 12 runes to parchment or offline vault. They are the sole key to your identity. If lost, your sanctum is forever sealed.
            </p>

            {/* 12 Rune Tablets Grid (3 columns x 4 rows) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                width: '100%',
                marginBottom: '18px',
              }}
            >
              {runeWords.map((word, idx) => {
                const isRevealed = revealedRunes.includes(idx);
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--void-2)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                      opacity: isRevealed ? 1 : 0.2,
                      transform: isRevealed ? 'translateY(0)' : 'translateY(4px)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        minWidth: '16px',
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: '#ffffff',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {isRevealed ? word : '••••••'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Copy Button */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '22px' }}>
              <button
                onClick={handleCopyAllRunes}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: copiedRunes ? 'var(--status-online)' : 'var(--text-silver)',
                  padding: '6px 14px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <IconCopyBlade size={13} />
                <span>{copiedRunes ? 'RUNES COPIED TO CLIPBOARD' : 'COPY ALL 12 RUNES'}</span>
              </button>
            </div>

            {/* Seal & Enter Action */}
            <ChromeButton
              variant="solid"
              size="lg"
              onClick={handleSealAndEnter}
              style={{ width: '100%' }}
            >
              SEAL IDENTITY & ENTER SANCTUM
            </ChromeButton>
          </div>
        )}

        {/* STEP 4: RECALL EXISTING SANCTUM */}
        {step === 'recall' && (
          <form
            onSubmit={handleRecallSubmit}
            className="anim-slice-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              background: 'var(--void-1)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              padding: '28px 24px',
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Top Back Nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setStep('intro');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                }}
              >
                <IconChevron size={14} direction="left" />
                <span>BACK</span>
              </button>

              <span className="tracked-micro">RECOVERY COVENANT</span>
            </div>

            <EmblemLogo size={48} />

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                letterSpacing: '0.22em',
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: '12px 0 4px',
              }}
            >
              RECALL SANCTUM
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
              Inscribe your 12 sacred recall runes separated by spaces to reconstitute your battle identity and private vault.
            </p>

            <div style={{ width: '100%', marginBottom: '14px' }}>
              <BladeInput
                label="WARRIOR HANDLE"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. Vanguard"
              />
            </div>

            <div style={{ width: '100%', marginBottom: '20px' }}>
              <label className="tracked-micro" style={{ display: 'block', marginBottom: '6px' }}>
                12 RECALL RUNES
              </label>
              <textarea
                required
                rows={3}
                value={recallMnemonic}
                onChange={(e) => setRecallMnemonic(e.target.value)}
                placeholder="obsidian chrome blade ritual sanctum vanguard cipher monolith seal vertex silent apex"
                style={{
                  width: '100%',
                  background: 'var(--void-0)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '2px',
                  color: 'var(--text-white)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  padding: '12px',
                  outline: 'none',
                  resize: 'none',
                  userSelect: 'text',
                }}
              />
              {recallError && (
                <div style={{ color: '#f87171', fontSize: '11px', marginTop: '6px' }}>
                  ✕ {recallError}
                </div>
              )}
            </div>

            <ChromeButton variant="solid" size="lg" type="submit" style={{ width: '100%' }}>
              REKINDLE IDENTITY & ENTER
            </ChromeButton>
          </form>
        )}
      </div>
    </div>
  );
};
