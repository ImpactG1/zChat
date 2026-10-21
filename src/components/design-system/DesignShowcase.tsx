import React, { useState } from 'react';
import { ChromeButton } from './ChromeButton';
import { BladeInput } from './BladeInput';
import { BladeDivider } from './BladeDivider';
import { TrackedBadge } from './TrackedBadge';
import { MessageBubble } from './MessageBubble';
import { VoiceWaveformRazor } from './VoiceWaveformRazor';
import { KeyFingerprintVisualizer } from './KeyFingerprintVisualizer';
import { FogCanvas } from './FogCanvas';
import { EmblemLogo } from '@/components/common/EmblemLogo';
import {
  IconShieldLock,
  IconBladeSend,
  IconRelayTower,
  IconVoiceMic,
  IconVoiceWave,
  IconSearchLoupe,
  IconKeyVault,
  IconBubbleOverlay,
  IconGhostMode,
  IconClickThrough,
  IconCrown,
  IconChevron,
  IconTimerSand,
  IconCheckDouble,
  IconCopyBlade,
  IconTrashFlame,
  IconSettingsGears,
  IconFogWave,
  IconClose,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

export const DesignShowcase: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'icons' | 'components' | 'chat' | 'references'>('tokens');
  const [fogDensity, setFogDensity] = useState<'off' | 'low' | 'high'>('low');
  const [inputVal, setInputVal] = useState('Whisper payload sealed with curve25519');

  const icons = [
    { name: 'IconShieldLock', comp: <IconShieldLock size={24} color="var(--status-encrypted)" /> },
    { name: 'IconBladeSend', comp: <IconBladeSend size={24} color="#ffffff" /> },
    { name: 'IconRelayTower', comp: <IconRelayTower size={24} color="var(--status-relay-ok)" /> },
    { name: 'IconVoiceMic', comp: <IconVoiceMic size={24} color="#ffffff" /> },
    { name: 'IconVoiceWave', comp: <IconVoiceWave size={24} color="#ffffff" /> },
    { name: 'IconSearchLoupe', comp: <IconSearchLoupe size={24} color="#ffffff" /> },
    { name: 'IconKeyVault', comp: <IconKeyVault size={24} color="#ffffff" /> },
    { name: 'IconBubbleOverlay', comp: <IconBubbleOverlay size={24} color="#ffffff" /> },
    { name: 'IconGhostMode', comp: <IconGhostMode size={24} color="#ffffff" /> },
    { name: 'IconClickThrough', comp: <IconClickThrough size={24} color="#ffffff" /> },
    { name: 'IconCrown', comp: <IconCrown size={24} color="var(--status-warning)" /> },
    { name: 'IconChevron', comp: <IconChevron size={24} color="#ffffff" /> },
    { name: 'IconTimerSand', comp: <IconTimerSand size={24} color="var(--status-warning)" /> },
    { name: 'IconCheckDouble', comp: <IconCheckDouble size={24} color="var(--status-online)" /> },
    { name: 'IconCopyBlade', comp: <IconCopyBlade size={24} color="#ffffff" /> },
    { name: 'IconTrashFlame', comp: <IconTrashFlame size={24} color="var(--status-error)" /> },
    { name: 'IconSettingsGears', comp: <IconSettingsGears size={24} color="#ffffff" /> },
    { name: 'IconFogWave', comp: <IconFogWave size={24} color="#ffffff" /> },
    { name: 'IconClose', comp: <IconClose size={24} color="#ffffff" /> },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--void-0)',
        color: 'var(--text-white)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background Fog Canvas */}
      <FogCanvas density={fogDensity} />

      {/* Top Header Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(5, 6, 8, 0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <EmblemLogo size={34} glow />
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                margin: 0,
                color: '#ffffff',
              }}
            >
              ZENYTH // DESIGN SYSTEM
            </h1>
            <div className="tracked-micro" style={{ marginTop: '2px' }}>
              STRICT TOKENS ◆ CHROME MATRIX ◆ WCAG AAA
            </div>
          </div>
        </div>

        {/* Global Controls & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Fog Toggle */}
          <button
            onClick={() => setFogDensity(fogDensity === 'off' ? 'low' : fogDensity === 'low' ? 'high' : 'off')}
            style={{
              background: 'var(--void-2)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: 'var(--text-silver)',
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconFogWave size={14} />
            <span>FOG: {fogDensity.toUpperCase()}</span>
          </button>

          {onExit && (
            <ChromeButton variant="solid" size="sm" onClick={onExit}>
              LAUNCH APP
            </ChromeButton>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'var(--void-1)',
          position: 'sticky',
          top: '67px',
          zIndex: 40,
        }}
      >
        {(['tokens', 'icons', 'components', 'chat', 'references'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              SoundEngine.playBladeTick();
              setActiveTab(tab);
            }}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? 'var(--void-3)' : 'transparent',
              border: activeTab === tab ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid transparent',
              color: activeTab === tab ? '#ffffff' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 700,
              cursor: 'pointer',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Showcase Content */}
      <main style={{ padding: '28px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', zIndex: 10 }}>
        {/* TAB 1: TOKENS */}
        {activeTab === 'tokens' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Section 1: Elevation Stair */}
            <section>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '8px', color: '#ffffff' }}>
                ELEVATION & VOID LAYERS (3-4 STEPS)
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Strict monochrome depth. Zero washed-out gray; every layer retains deep obsidian graphite luminance.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {[
                  { name: '--void-0', hex: '#000000', role: 'Base Ground Void' },
                  { name: '--void-1', hex: '#050608', role: 'Sidebar / Inset Surface' },
                  { name: '--void-2', hex: '#0b0d11', role: 'Card / Panel Surface' },
                  { name: '--void-3', hex: '#12151c', role: 'Elevated / Hover Layer' },
                  { name: '--void-4', hex: '#191d26', role: 'Active Popup / Tooltip' },
                ].map((v) => (
                  <div
                    key={v.name}
                    style={{
                      background: v.hex,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '16px',
                      borderRadius: '2px',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                      {v.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {v.hex}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      {v.role}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <BladeDivider label="SPECULAR LIGHT & CHROME" />

            {/* Section 2: Chrome Gradients */}
            <section>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '8px', color: '#ffffff' }}>
                LIQUID CHROME & SPECULAR LIGHT
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div
                  className="chrome-border"
                  style={{
                    padding: '20px',
                    borderRadius: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <span className="tracked-micro">--gradient-chrome-border</span>
                  <div style={{ fontSize: '13px', color: 'var(--text-silver)' }}>
                    1px angled metallic edge highlight simulating faceted bevels.
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--gradient-chrome-surface)',
                    color: 'var(--text-inverse)',
                    padding: '20px',
                    borderRadius: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                    --gradient-chrome-surface
                  </span>
                  <div style={{ fontSize: '13px' }}>Solid forged chrome metal surface with pure black typography.</div>
                </div>

                <div
                  style={{
                    background: 'var(--void-2)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <span className="tracked-micro">--gradient-blade-line</span>
                  <div
                    style={{
                      height: '2px',
                      background: 'var(--gradient-blade-line)',
                      marginTop: '12px',
                      width: '100%',
                    }}
                  />
                </div>
              </div>
            </section>

            <BladeDivider label="TYPOGRAPHY SCALE" />

            {/* Section 3: Typography */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span className="tracked-micro">DISPLAY MONUMENTAL (Cinzel, 0.25em tracking)</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '0.25em', margin: '4px 0', color: '#ffffff' }}>
                  ZENYTH // DUELING GROUNDS
                </h1>
              </div>

              <div>
                <span className="tracked-micro">DISPLAY TITLE (Cinzel, 0.18em tracking)</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '0.18em', margin: '4px 0', color: 'var(--text-silver)' }}>
                  MORE THAN A CLAN ◆ COMPETE ◆ IMPROVE ◆ BELONG
                </h2>
              </div>

              <div>
                <span className="tracked-micro">BODY TEXT (Inter, 14px, 1.55 line-height, WCAG AAA 16.2:1 Contrast)</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-white)', maxWidth: '640px', marginTop: '4px' }}>
                  A serverless, end-to-end-encrypted sanctuary. Cryptographic identities are forged in pure mathematics,
                  dispersed through decentralized Nostr relays, and floating seamlessly above combat through lightweight overlays.
                </p>
              </div>

              <div>
                <span className="tracked-micro">UPPERCASE MICRO-LABEL (10px, 0.3em tracking)</span>
                <div style={{ marginTop: '4px' }}>
                  <TrackedBadge label="IDENTITY FORGED" variant="chrome" />
                  <span style={{ margin: '0 8px' }} />
                  <TrackedBadge label="RELAY 01 CONNECTED" variant="relay" />
                  <span style={{ margin: '0 8px' }} />
                  <TrackedBadge label="DISAPPEARING: 24H" variant="warning" />
                  <span style={{ margin: '0 8px' }} />
                  <TrackedBadge label="SEAL BREACHED" variant="error" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: BESPOKE RAZOR ICONS */}
        {activeTab === 'icons' && (
          <section>
            <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '8px', color: '#ffffff' }}>
              CUSTOM RAZOR SVG ICON KIT (20 BESPOKE ICONS)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Non-generic, thin 1.35px stroke with sharp miter joins and blade diamond geometry. No standard icon packs.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '12px',
              }}
            >
              {icons.map((item) => (
                <div
                  key={item.name}
                  style={{
                    background: 'var(--void-1)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: '2px',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  <div style={{ padding: '8px' }}>{item.comp}</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: ATOMIC COMPONENTS */}
        {activeTab === 'components' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Buttons */}
            <section>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '14px', color: '#ffffff' }}>
                CHROME BUTTONS (CHAMFERED + METALLIC TICK SOUND)
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                <ChromeButton variant="solid" size="md" icon={<IconBladeSend size={14} color="#000" />}>
                  SEAL & TRANSMIT
                </ChromeButton>
                <ChromeButton variant="outline" size="md" icon={<IconShieldLock size={14} color="#fff" />}>
                  ENCRYPT CHANNEL
                </ChromeButton>
                <ChromeButton variant="ghost" size="md">
                  GHOST ACTION
                </ChromeButton>
                <ChromeButton variant="danger" size="md" icon={<IconTrashFlame size={14} color="#f87171" />}>
                  INCINERATE VAULT
                </ChromeButton>
                <ChromeButton variant="solid" size="md" isLoading>
                  FORGING...
                </ChromeButton>
              </div>
            </section>

            <BladeDivider label="BLADE INPUT FIELD" />

            {/* Inputs */}
            <section style={{ maxWidth: '520px' }}>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '14px', color: '#ffffff' }}>
                BLADE INPUT FIELD
              </h2>
              <BladeInput
                label="Enter Whispering Channel / Contact Pubkey"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                leftIcon={<IconSearchLoupe size={16} />}
                rightAction={
                  <ChromeButton variant="solid" size="sm" onClick={() => SoundEngine.playBladeTick()}>
                    SEND
                  </ChromeButton>
                }
              />
            </section>

            <BladeDivider label="AUDIO & HAPTIC SYNTHESIS TEST" />

            {/* Sound Test */}
            <section>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '12px', color: '#ffffff' }}>
                SYNTHESIZED METALLIC FEEDBACK
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Pure Web Audio API synthesis. Zero network assets, zero latency, runs offline.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <ChromeButton variant="outline" size="md" onClick={() => SoundEngine.playBladeTick()}>
                  TEST BLADE TICK (3800Hz)
                </ChromeButton>
                <ChromeButton variant="outline" size="md" onClick={() => SoundEngine.playSealChime()}>
                  TEST CELESTIAL CHIME (880Hz)
                </ChromeButton>
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: CHAT MOLECULES */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <section>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '8px', color: '#ffffff' }}>
                MESSAGE BUBBLES (ASYMMETRICAL CHAMFER + SPECULAR SLIVER)
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Outgoing messages feature cut upper-right/lower-left corners with a specular sliver highlight. Incoming
                feature sender identification tags and encrypted shield status.
              </p>

              <div
                style={{
                  background: 'var(--void-1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '24px',
                  borderRadius: '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxWidth: '680px',
                }}
              >
                <MessageBubble
                  id="demo_1"
                  senderName="Viper"
                  senderTag="#8f3a"
                  content="The relay handoff succeeded. Epoch III encryption key is synchronized across all 4 squad nodes."
                  timestamp={Date.now() - 1000 * 60 * 8}
                  isSelf={false}
                  disappearingTimer="23h 58m"
                  reactions={[{ sigil: '⚔', count: 2, userReacted: true }, { sigil: '◆', count: 1 }]}
                />

                <MessageBubble
                  id="demo_2"
                  content="Understood. Perimeter is holding. I am engaging the overlay HUD mode."
                  timestamp={Date.now() - 1000 * 60 * 3}
                  isSelf={true}
                  status="delivered"
                  replyTo={{
                    senderName: 'Viper',
                    content: 'Epoch III encryption key is synchronized...',
                  }}
                  reactions={[{ sigil: '✦', count: 3 }]}
                />
              </div>
            </section>

            <BladeDivider label="RAZOR VOICE WAVEFORM" />

            <section>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '12px', color: '#ffffff' }}>
                SHARP NEEDLE VOICE WAVEFORM
              </h2>
              <VoiceWaveformRazor durationSeconds={32} />
            </section>

            <BladeDivider label="KEY FINGERPRINT VISUALIZER" />

            <section>
              <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '12px', color: '#ffffff' }}>
                8×8 CRYPTOGRAPHIC FINGERPRINT MATRIX
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Visualizes the 64-char public key as an ancient ritualistic sigil plate with luminosity mapping.
              </p>
              <KeyFingerprintVisualizer
                pubkey="7e2a91b48f6c3109d0e821ba44c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c8"
                tag="#7e2a"
              />
            </section>
          </div>
        )}

        {/* TAB 5: VISUAL REFERENCES COMPARISON */}
        {activeTab === 'references' && (
          <section>
            <h2 className="font-display" style={{ fontSize: '14px', marginBottom: '8px', color: '#ffffff' }}>
              VISUAL REFERENCE BENCHMARK
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              All UI components are continuously validated against the brand logo and the Zenyth Dueling Grounds poster.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              <div
                style={{
                  background: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <span className="tracked-micro" style={{ marginBottom: '12px' }}>
                  REFERENCE 1: LIQUID CHROME EMBLEM
                </span>
                <img
                  src="/logo.png"
                  alt="Zenyth Liquid Chrome Logo"
                  style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }}
                />
              </div>

              <div
                style={{
                  background: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <span className="tracked-micro" style={{ marginBottom: '12px' }}>
                  REFERENCE 2: DUELING GROUNDS POSTER
                </span>
                <img
                  src="/zenyth_poster.jpg"
                  alt="Zenyth Dueling Grounds Poster"
                  style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }}
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
