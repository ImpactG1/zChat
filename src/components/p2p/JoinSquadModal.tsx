import React, { useState } from 'react';
import { useP2PStore } from '@/stores/useP2PStore';
import { Users, ArrowRight, ShieldAlert } from 'lucide-react';

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
    if (!cleanCode) {
      setErrorMsg('Please enter a squad code');
      return;
    }

    setIsJoining(true);
    setErrorMsg('');
    try {
      await joinSquad(cleanCode);
      onSquadJoined(cleanCode);
      onClose();
    } catch {
      setErrorMsg('Failed to join squad room. Please check the code.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
      <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderColor: 'var(--accent-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 240, 255, 0.2)',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Join Squad Party</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enter 6-digit squad code from host</p>
          </div>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Squad Party Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SQUAD-77, ALPHA-9"
              value={squadCode}
              onChange={(e) => setSquadCode(e.target.value.toUpperCase())}
              className="cyber-input"
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '1px',
                textAlign: 'center',
              }}
              autoFocus
            />
            {errorMsg && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} />
                {errorMsg}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="cyber-button"
              style={{ background: 'transparent' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isJoining || !squadCode.trim()}
              className="cyber-button"
            >
              <span>{isJoining ? 'Connecting P2P...' : 'Join Squad'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
