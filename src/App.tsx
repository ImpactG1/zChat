import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRelayStore } from '@/stores/useRelayStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { retryOutboxMessages } from '@/core/nostr/messageSender';
import { nostrClient } from '@/core/nostr/client';
import { GroupManager } from '@/core/groups/groupManager';
import { Header } from '@/components/common/Header';
import { OverlayHUDBar } from '@/components/overlay/OverlayHUDBar';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatView } from '@/components/chat/ChatView';
import { GroupChatView } from '@/components/groups/GroupChatView';
import { RelayModal } from '@/components/settings/RelayModal';
import { SeedBackupModal } from '@/components/settings/SeedBackupModal';
import { ThemeSwitcherModal } from '@/components/settings/ThemeSwitcherModal';
import { AuthModal } from '@/components/auth/AuthModal';

export const App: React.FC = () => {
  const { identity, isInitialized, init } = useAuthStore();
  const { loadRelays } = useRelayStore();
  const { initTheme } = useThemeStore();

  const [activePubkey, setActivePubkey] = useState<string | undefined>();
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>();

  const [showRelays, setShowRelays] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    init();
    initTheme();
    loadRelays();

    // Outbox background retry interval
    const retryTimer = setInterval(() => {
      retryOutboxMessages().catch((e) => console.warn('Outbox retry failed:', e));
    }, 15000);

    // Group message subscription across connected relays
    const groupSubUnsubscribe = nostrClient.subscribeToEvents(
      {
        kinds: [9002],
        since: Math.floor((Date.now() - 3 * 24 * 60 * 60 * 1000) / 1000),
      },
      (event) => {
        GroupManager.processIncomingGroupEvent(event);
      }
    );

    return () => {
      clearInterval(retryTimer);
      groupSubUnsubscribe();
    };
  }, [init, initTheme, loadRelays]);

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
        onOpenThemes={() => setShowThemes(true)}
      />

      {/* Gamer HUD Opacity & Click-Through Controller */}
      <OverlayHUDBar />

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {activeGroupId ? (
          <GroupChatView
            groupId={activeGroupId}
            onBack={() => setActiveGroupId(undefined)}
          />
        ) : activePubkey ? (
          <ChatView
            contactPubkey={activePubkey}
            onBack={() => setActivePubkey(undefined)}
          />
        ) : (
          <ConversationList
            activePubkey={activePubkey}
            activeGroupId={activeGroupId}
            onSelectContact={(pubkey) => {
              setActivePubkey(pubkey);
              setActiveGroupId(undefined);
            }}
            onSelectGroup={(groupId) => {
              setActiveGroupId(groupId);
              setActivePubkey(undefined);
            }}
          />
        )}
      </main>

      {/* Modals */}
      {showRelays && <RelayModal onClose={() => setShowRelays(false)} />}
      {showSeed && <SeedBackupModal onClose={() => setShowSeed(false)} />}
      {showThemes && <ThemeSwitcherModal onClose={() => setShowThemes(false)} />}
    </div>
  );
};
