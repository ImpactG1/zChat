import React, { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { THEMES } from '@/styles/themes';
import { GamerTheme } from '@/types';
import { exportFullBackup, importFullBackup } from '@/core/storage/backup';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeDivider } from '@/components/design-system/BladeDivider';
import { TrackedBadge } from '@/components/design-system/TrackedBadge';
import {
  IconSettingsGears,
  IconClose,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface ThemeSwitcherModalProps {
  onClose: () => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({ onClose }) => {
  const { currentTheme, setTheme } = useThemeStore();
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(() => SoundEngine.isSoundMuted());

  const handleExport = async () => {
    SoundEngine.playBladeTick();
    const json = await exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenyth-vault-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 2500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const ok = await importFullBackup(content);
      if (ok) {
        SoundEngine.playSealChime();
        setImportStatus('Chat vault restored successfully. Loading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    SoundEngine.setMuted(next);
    if (!next) SoundEngine.playBladeTick();
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
          maxWidth: '500px',
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
            <IconSettingsGears size={18} color="var(--text-silver)" />
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
              SETTINGS & PREFERENCES
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

        {/* Theme Palette Selection */}
        <div className="tracked-micro" style={{ marginBottom: '10px' }}>
          MONOLITHIC VISUAL PALETTE
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {(Object.keys(THEMES) as GamerTheme[]).map((key) => {
            const t = THEMES[key];
            const isSelected = currentTheme === key;
            return (
              <button
                key={key}
                onClick={() => {
                  SoundEngine.playBladeTick();
                  setTheme(key);
                }}
                style={{
                  background: t.bgPrimary,
                  border: isSelected ? '1px solid rgba(255, 255, 255, 0.7)' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '12px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: isSelected ? '0 0 14px rgba(255, 255, 255, 0.12)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.12em', color: '#ffffff', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.name}
                  </span>
                  {isSelected && <TrackedBadge label="ACTIVE" variant="chrome" />}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', background: t.accentPrimary, border: '1px solid rgba(255,255,255,0.2)' }} />
                  <div style={{ width: '12px', height: '12px', background: t.accentSecondary, border: '1px solid rgba(255,255,255,0.2)' }} />
                  <div style={{ width: '12px', height: '12px', background: t.bgCard, border: '1px solid rgba(255,255,255,0.2)' }} />
                </div>
              </button>
            );
          })}
        </div>

        <BladeDivider label="AUDIO & SENSORY" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>Synthesized Blade Audio</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Low-latency Web Audio API metallic strike & chime</div>
          </div>
          <button
            onClick={toggleSound}
            style={{
              padding: '6px 12px',
              background: !soundMuted ? 'rgba(255, 255, 255, 0.14)' : 'var(--void-2)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            {!soundMuted ? 'ENABLED' : 'MUTED'}
          </button>
        </div>

        <BladeDivider label="VAULT BACKUP & PORTABILITY" />

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <ChromeButton variant="outline" size="sm" onClick={handleExport} style={{ flex: 1 }}>
            {backupSuccess ? 'VAULT EXPORTED' : 'EXPORT BACKUP JSON'}
          </ChromeButton>

          <label
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--void-2)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '2px',
              textTransform: 'uppercase',
              minHeight: '32px',
            }}
          >
            IMPORT BACKUP
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>
        </div>

        {importStatus && (
          <div style={{ fontSize: '12px', color: 'var(--status-online)', marginTop: '10px', textAlign: 'center' }}>
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
};
