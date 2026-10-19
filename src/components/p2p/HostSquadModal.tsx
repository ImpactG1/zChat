import React, { useState } from 'react';
import { useP2PStore } from '@/stores/useP2PStore';
import { Sparkles, Radio } from 'lucide-react';

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
    try {
      const code = await createSquad(squadCode.trim());
      onSquadCreated(code);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
      <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderColor: 'var(--accent-purple)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(157, 78, 221, 0.2)',
              border: '1px solid var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={22} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Host Squad Party</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Direct sub-30ms P2P UDP Mesh across India</p>
          </div>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              6-Character Squad Party Code
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                maxLength={12}
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
                  borderColor: 'var(--accent-purple)',
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Share this short code with your teammates in any city. No 64-char crypto keys required!
            </span>
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
              disabled={isCreating || !squadCode.trim()}
              className="cyber-button"
              style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' }}
            >
              <Sparkles size={16} />
              <span>{isCreating ? 'Initializing...' : 'Launch Squad'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
