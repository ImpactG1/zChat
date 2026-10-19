import React, { useState } from 'react';
import { useRelayStore } from '@/stores/useRelayStore';
import { Radio, Plus, Trash2, RefreshCw, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface RelayModalProps {
  onClose: () => void;
}

export const RelayModal: React.FC<RelayModalProps> = ({ onClose }) => {
  const { relays, toggleRelay, addRelay, removeRelay, pingAll } = useRelayStore();
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelayUrl.trim()) return;
    setErrorMsg('');
    setIsAdding(true);
    const success = await addRelay(newRelayUrl);
    setIsAdding(false);
    if (!success) {
      setErrorMsg('Relay already exists in pool');
    } else {
      setNewRelayUrl('');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
      <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Nostr Relay Mesh</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => pingAll()}
              className="cyber-button"
              style={{ padding: '6px 10px', fontSize: '11px' }}
              title="Ping all relays"
            >
              <RefreshCw size={13} />
              Ping
            </button>
            <button
              onClick={onClose}
              className="cyber-button"
              style={{ padding: '6px', background: 'transparent', borderColor: 'transparent' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add Relay Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="wss://relay.example.com"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            className="cyber-input"
            style={{ flex: 1, fontSize: '12px', fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="submit"
            disabled={isAdding || !newRelayUrl.trim()}
            className="cyber-button"
            style={{ padding: '8px 12px' }}
          >
            <Plus size={16} />
            Add
          </button>
        </form>

        {errorMsg && (
          <div style={{ color: 'var(--accent-rose)', fontSize: '12px', marginBottom: '10px' }}>
            {errorMsg}
          </div>
        )}

        {/* Relays List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {relays.map((relay) => (
            <div
              key={relay.url}
              className="glass-panel"
              style={{
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: relay.isEnabled ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={relay.isEnabled}
                  onChange={() => toggleRelay(relay.url)}
                  style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {relay.url}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {relay.status === 'connected' && <CheckCircle size={10} color="var(--accent-emerald)" />}
                      {relay.status === 'error' && <AlertTriangle size={10} color="var(--accent-rose)" />}
                      {relay.status}
                    </span>
                    {relay.latencyMs !== undefined && (
                      <span style={{ color: relay.latencyMs < 250 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                        {relay.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeRelay(relay.url)}
                className="cyber-button"
                style={{ padding: '6px', background: 'transparent', borderColor: 'transparent', color: 'var(--accent-rose)' }}
                title="Remove Relay"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
