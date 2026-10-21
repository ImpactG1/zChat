import React, { useState } from 'react';
import { useP2PStore } from '@/stores/useP2PStore';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import { IconClose } from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface HostSquadModalProps {
  onClose: () => void;
  onSquadCreated: (code: string) => void;
}

export const HostSquadModal: React.FC<HostSquadModalProps> = ({ onClose, onSquadCreated }) => {
  const { createSquad } = useP2PStore();
  const defaultCode = `SQUAD-${Math.floor(10 + Math.random() * 90)}`;
  const [squadCode, setSquadCode] = useState(defaultCode);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadCode.trim()) return;

    setIsCreating(true);
    SoundEngine.playSealChime();
    try {
      const code = await createSquad(squadCode.trim());
      onSquadCreated(code);
      onClose();
    } finally {
      setIsCreating(false);
    }
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
      <form
        onSubmit={handleCreate}
        className="anim-slice-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--void-1)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
          padding: '24px',
          boxShadow: '0 8px 36px rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tracked-micro">DIRECT P2P ROOM</span>
          <button
            type="button"
            onClick={() => {
              SoundEngine.playBladeTick();
              onClose();
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <IconClose size={15} />
          </button>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            letterSpacing: '0.18em',
            color: '#ffffff',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          CREATE P2P ROOM
        </h3>

        <BladeInput
          label="ROOM CODE"
          value={squadCode}
          onChange={(e) => setSquadCode(e.target.value.toUpperCase())}
          placeholder="e.g. SQUAD-99"
          required
          autoFocus
        />

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Creates a direct peer-to-peer room for fast chat with your friends.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <ChromeButton
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              SoundEngine.playBladeTick();
              onClose();
            }}
          >
            CANCEL
          </ChromeButton>

          <ChromeButton
            variant="solid"
            size="sm"
            type="submit"
            isLoading={isCreating}
          >
            CREATE ROOM
          </ChromeButton>
        </div>
      </form>
    </div>
  );
};
