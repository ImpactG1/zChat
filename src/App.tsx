import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRelayStore } from '@/stores/useRelayStore';
import { retryOutboxMessages } from '@/core/nostr/messageSender';
import { Header } from '@/components/common/Header';
import { OverlayHUDBar } from '@/components/overlay/OverlayHUDBar';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatView } from '@/components/chat/ChatView';
import { RelayModal } from '@/components/settings/RelayModal';
import { SeedBackupModal } from '@/components/settings/SeedBackupModal';
import { AuthModal } from '@/components/auth/AuthModal';

export const App: React.FC = () => {
  const { identity, isInitialized, init } = useAuthStore();
  const { loadRelays } = useRelayStore();
  const [activePubkey, setActivePubkey] = useState<string | undefined>();
  const [showRelays, setShowRelays] = useState(false);
  const [showSeed, setShowSeed] = useState(false);

  useEffect(() => {
    init();
    loadRelays();

    // Outbox background retry interval
    const retryTimer = setInterval(() => {
      retryOutboxMessages().catch((e) => console.warn('Outbox retry failed:', e));
    }, 15000);

    return () => clearInterval(retryTimer);
  }, [init, loadRelays]);

  if (!isInitialized) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
          Initializing zChat...
        </div>
      </div>
    );
  }

  if (!identity) {
    return <AuthModal />;
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Top Header */}
      <Header
        onOpenRelays={() => setShowRelays(true)}
        onOpenSeed={() => setShowSeed(true)}
      />

      {/* Gamer HUD Opacity & Click-Through Controller */}
      <OverlayHUDBar />

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {activePubkey ? (
          <ChatView
            contactPubkey={activePubkey}
            onBack={() => setActivePubkey(undefined)}
          />
        ) : (
          <ConversationList
            activePubkey={activePubkey}
            onSelectContact={(pubkey) => setActivePubkey(pubkey)}
          />
        )}
      </main>

      {/* Modals */}
      {showRelays && <RelayModal onClose={() => setShowRelays(false)} />}
      {showSeed && <SeedBackupModal onClose={() => setShowSeed(false)} />}
    </div>
  );
};
