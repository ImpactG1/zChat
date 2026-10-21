import React, { useState } from 'react';
import { useP2PStore } from '@/stores/useP2PStore';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import { IconClose } from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface JoinSquadModalProps {
  onClose: () => void;
  onSquadJoined: (code: string) => void;
}

export const JoinSquadModal: React.FC<JoinSquadModalProps> = ({ onClose, onSquadJoined }) => {
  const { joinSquad } = useP2PStore();
  const [squadCode, setSquadCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = squadCode.trim().toUpperCase();
    if (!cleanCode) return;

    setIsJoining(true);
    setErrorMsg('');
    SoundEngine.playSealChime();
    try {
      await joinSquad(cleanCode);
      onSquadJoined(cleanCode);
      onClose();
    } catch {
      setErrorMsg('Failed to locate peer mesh room. Check code.');
    } finally {
      setIsJoining(false);
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
        onSubmit={handleJoin}
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
          <span className="tracked-micro">PEER DISCOVERY</span>
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
          ENTER ROOM CODE
        </h3>

        <BladeInput
          label="6-DIGIT ROOM IDENTIFIER"
          value={squadCode}
          onChange={(e) => setSquadCode(e.target.value.toUpperCase())}
          placeholder="e.g. SQUAD-42, ROOM-99"
          required
          autoFocus
        />

        {errorMsg && (
          <div style={{ color: 'var(--status-error)', fontSize: '11px' }}>
            ✕ {errorMsg}
          </div>
        )}

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
            isLoading={isJoining}
          >
            JOIN ROOM
          </ChromeButton>
        </div>
      </form>
    </div>
  );
};
