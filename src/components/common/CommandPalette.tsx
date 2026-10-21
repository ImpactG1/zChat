import React, { useState, useEffect } from 'react';
import {
  IconSearchLoupe,
  IconBladeSend,
  IconBubbleOverlay,
  IconKeyVault,
  IconRelayTower,
  IconSettingsGears,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionKey: string) => void;
}

interface CommandItem {
  key: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onAction }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { key: 'new_sanctum', label: 'Create New Group', group: 'Groups', icon: <IconBladeSend size={14} />, shortcut: 'N' },
    { key: 'new_whisper', label: 'New Private Chat (1:1)', group: 'Private', icon: <IconSearchLoupe size={14} />, shortcut: 'W' },
    { key: 'toggle_overlay', label: 'Launch Floating Overlay HUD', group: 'HUD', icon: <IconBubbleOverlay size={14} />, shortcut: 'O' },
    { key: 'relays', label: 'Inspect Relay Network Pool', group: 'Network', icon: <IconRelayTower size={14} />, shortcut: 'R' },
    { key: 'backup', label: 'Reveal 12 Secret Recovery Words', group: 'Security', icon: <IconKeyVault size={14} />, shortcut: 'B' },
    { key: 'settings', label: 'Preferences & Themes', group: 'System', icon: <IconSettingsGears size={14} />, shortcut: 'S' },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.group.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          SoundEngine.playBladeTick();
          onAction(filtered[selectedIndex].key);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onAction, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 999999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-slice-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--void-1)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'var(--void-2)',
          }}
        >
          <IconSearchLoupe size={18} color="var(--text-silver)" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
            }}
          />
          <span
            style={{
              padding: '2px 6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              borderRadius: '2px',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.key}
                  onClick={() => {
                    SoundEngine.playBladeTick();
                    onAction(item.key);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isSelected ? 'var(--void-3)' : 'transparent',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: isSelected ? '#ffffff' : 'var(--text-muted)' }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', color: isSelected ? '#ffffff' : 'var(--text-silver)', fontWeight: 500 }}>
                      {item.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="tracked-micro" style={{ fontSize: '9px' }}>{item.group}</span>
                    {item.shortcut && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          padding: '1px 5px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                        }}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'var(--void-0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
        </div>
      </div>
    </div>
  );
};
