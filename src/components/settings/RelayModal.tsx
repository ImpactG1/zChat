import React, { useState } from 'react';
import { useRelayStore } from '@/stores/useRelayStore';
import { ChromeButton } from '@/components/design-system/ChromeButton';
import { BladeInput } from '@/components/design-system/BladeInput';
import { TrackedBadge } from '@/components/design-system/TrackedBadge';
import {
  IconRelayTower,
  IconTrashFlame,
  IconClose,
} from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

interface RelayModalProps {
  onClose: () => void;
}

export const RelayModal: React.FC<RelayModalProps> = ({ onClose }) => {
  const { relays, toggleRelay, addRelay, removeRelay, pingAll } = useRelayStore();
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelayUrl.trim()) return;
    setErrorMsg('');
    setIsAdding(true);
    SoundEngine.playBladeTick();
    const success = await addRelay(newRelayUrl);
    setIsAdding(false);
    if (!success) {
      setErrorMsg('Relay already exists in pool');
    } else {
      setNewRelayUrl('');
    }
  };

  const handlePing = () => {
    setIsPinging(true);
    SoundEngine.playBladeTick();
    pingAll();
    setTimeout(() => setIsPinging(false), 1200);
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
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--void-1)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          padding: '24px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.95)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconRelayTower size={18} color="var(--status-relay-ok)" />
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
              RELAY MESH POOL
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChromeButton
              variant="outline"
              size="sm"
              onClick={handlePing}
              isLoading={isPinging}
              style={{ padding: '4px 10px', minHeight: '30px' }}
            >
              PING ALL
            </ChromeButton>

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
        </div>

        {/* Add Relay Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <BladeInput
              placeholder="wss://relay.example.com"
              value={newRelayUrl}
              onChange={(e) => setNewRelayUrl(e.target.value)}
              style={{ height: '38px', fontSize: '12px' }}
            />
          </div>
          <ChromeButton
            variant="solid"
            size="sm"
            type="submit"
            disabled={!newRelayUrl.trim() || isAdding}
            style={{ height: '38px', minHeight: '38px', padding: '0 14px' }}
          >
            + ADD
          </ChromeButton>
        </form>

        {errorMsg && (
          <div style={{ color: 'var(--status-error)', fontSize: '11px', marginBottom: '12px' }}>
            ✕ {errorMsg}
          </div>
        )}

        {/* Relay List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {relays.map((relay) => {
            const isOk = relay.status === 'connected';
            return (
              <div
                key={relay.url}
                style={{
                  background: 'var(--void-2)',
                  border: `1px solid ${isOk ? 'rgba(82, 128, 104, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '2px',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ffffff', wordBreak: 'break-all' }}>
                    {relay.url}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <TrackedBadge
                      label={relay.status.toUpperCase()}
                      variant={isOk ? 'relay' : 'error'}
                    />
                    {relay.latencyMs !== undefined && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                        {relay.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => {
                      SoundEngine.playBladeTick();
                      toggleRelay(relay.url);
                    }}
                    style={{
                      background: 'var(--void-3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: relay.isEnabled ? 'var(--status-relay-ok)' : 'var(--text-muted)',
                      padding: '4px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      cursor: 'pointer',
                      borderRadius: '2px',
                    }}
                  >
                    {relay.isEnabled ? 'SEVER' : 'CONNECT'}
                  </button>

                  <button
                    onClick={() => {
                      SoundEngine.playBladeTick();
                      removeRelay(relay.url);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Remove Relay"
                  >
                    <IconTrashFlame size={13} color="var(--status-error)" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
