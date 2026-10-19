import React, { useState } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { THEMES } from '@/styles/themes';
import { GamerTheme } from '@/types';
import { exportFullBackup, importFullBackup } from '@/core/storage/backup';
import { Palette, Download, Upload, X, Check, CheckCircle2 } from 'lucide-react';

interface ThemeSwitcherModalProps {
  onClose: () => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({ onClose }) => {
  const { currentTheme, setTheme } = useThemeStore();
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = async () => {
    const json = await exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zchat-backup-${Date.now()}.json`;
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
        setImportStatus('Backup restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
      <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '460px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>HUD Themes & Backup</h3>
          </div>
          <button
            onClick={onClose}
            className="cyber-button"
            style={{ padding: '6px', background: 'transparent', borderColor: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme Grid */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
            Select Gaming Visual Theme
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {(Object.keys(THEMES) as GamerTheme[]).map((key) => {
              const theme = THEMES[key];
              const isSelected = currentTheme === key;
              return (
                <div
                  key={key}
                  onClick={() => setTheme(key)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: theme.bgCard,
                    border: `1.5px solid ${isSelected ? theme.accentPrimary : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 14px ${theme.accentGlow}` : undefined,
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{theme.name}</span>
                    {isSelected && <Check size={14} color={theme.accentPrimary} />}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.accentPrimary }} />
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.accentSecondary }} />
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: theme.bgPrimary, border: '1px solid #fff' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Backup & Restore */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>
            Data Backup & Migration
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExport}
              className="cyber-button"
              style={{ flex: 1, padding: '10px', fontSize: '12px' }}
            >
              {backupSuccess ? <CheckCircle2 size={15} color="var(--accent-emerald)" /> : <Download size={15} />}
              <span>{backupSuccess ? 'Downloaded!' : 'Export Backup'}</span>
            </button>

            <label
              className="cyber-button"
              style={{ flex: 1, padding: '10px', fontSize: '12px', cursor: 'pointer', background: 'transparent' }}
            >
              <Upload size={15} />
              <span>Import Backup</span>
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>
          {importStatus && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent-cyan)', textAlign: 'center' }}>
              {importStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
