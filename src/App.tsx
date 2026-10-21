import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRelayStore } from '@/stores/useRelayStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useP2PStore } from '@/stores/useP2PStore';
import { retryOutboxMessages } from '@/core/nostr/messageSender';
import { nostrClient } from '@/core/nostr/client';
import { GroupManager } from '@/core/groups/groupManager';
import { Header } from '@/components/common/Header';
import { FloatingOverlayHUD } from '@/components/overlay/FloatingOverlayHUD';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatView } from '@/components/chat/ChatView';
import { GroupChatView } from '@/components/groups/GroupChatView';
import { SquadRoomView } from '@/components/p2p/SquadRoomView';
import { RelayModal } from '@/components/settings/RelayModal';
import { SeedBackupModal } from '@/components/settings/SeedBackupModal';
import { ThemeSwitcherModal } from '@/components/settings/ThemeSwitcherModal';
import { SplashOnboarding } from '@/components/auth/SplashOnboarding';
import { DesktopLayout } from '@/components/desktop/DesktopLayout';
import { purgeLegacyDemoData } from '@/core/storage/db';
import { CommandPalette } from '@/components/common/CommandPalette';
import { useOverlayStore } from '@/stores/useOverlayStore';

export const App: React.FC = () => {
  const { identity, isInitialized, init } = useAuthStore();
  const { loadRelays } = useRelayStore();
  const { initTheme } = useThemeStore();
  const { init: initP2P, roomState } = useP2PStore();
  const { toggleOverlay } = useOverlayStore();

  const [activePubkey, setActivePubkey] = useState<string | undefined>();
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>();
  const [activeSquadCode, setActiveSquadCode] = useState<string | undefined>();

  const [showRelays, setShowRelays] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 960;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopLayout(window.innerWidth >= 960);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandAction = (actionKey: string) => {
    switch (actionKey) {
      case 'toggle_overlay':
        toggleOverlay();
        break;
      case 'relays':
        setShowRelays(true);
        break;
      case 'backup':
        setShowSeed(true);
        break;
      case 'settings':
        setShowThemes(true);
        break;
      case 'new_whisper':
      case 'new_sanctum':
        setActivePubkey(undefined);
        setActiveGroupId(undefined);
        break;
    }
  };


  useEffect(() => {
    init();
    initTheme();
    loadRelays();
    initP2P();
    purgeLegacyDemoData();

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
  }, [init, initTheme, loadRelays, initP2P]);

  // Keep active squad view in sync if room changes
  useEffect(() => {
    if (roomState.code && !activePubkey && !activeGroupId) {
      setActiveSquadCode(roomState.code);
    }
  }, [roomState.code, activePubkey, activeGroupId]);


  if (!isInitialized) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--void-0)' }}>
        <div style={{ color: 'var(--text-white)', fontFamily: 'var(--font-display)', letterSpacing: '0.25em', fontSize: '13px' }}>
          FORGING ZENYTH SANCTUM...
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <SplashOnboarding />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Top Header */}
      <Header
        onOpenRelays={() => setShowRelays(true)}
        onOpenSeed={() => setShowSeed(true)}
        onOpenThemes={() => setShowThemes(true)}
      />

      {/* Floating Zenyth Overlay HUD (Bubble, Mini, Full Panel) */}
      <FloatingOverlayHUD />

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {isDesktopLayout ? (
          <DesktopLayout
            activePubkey={activePubkey}
            activeGroupId={activeGroupId}
            activeSquadCode={activeSquadCode}
            onSelectContact={(pubkey) => {
              setActivePubkey(pubkey);
              setActiveGroupId(undefined);
              setActiveSquadCode(undefined);
            }}
            onSelectGroup={(groupId) => {
              setActiveGroupId(groupId);
              setActivePubkey(undefined);
              setActiveSquadCode(undefined);
            }}
            onSelectSquad={(code) => {
              setActiveSquadCode(code);
              setActivePubkey(undefined);
              setActiveGroupId(undefined);
            }}
            onBack={() => {
              setActivePubkey(undefined);
              setActiveGroupId(undefined);
              setActiveSquadCode(undefined);
            }}
            onOpenRelays={() => setShowRelays(true)}
            onOpenSeed={() => setShowSeed(true)}
            onOpenCommandPalette={() => setShowCommandPalette(true)}
          />
        ) : activeSquadCode ? (
          <SquadRoomView
            onBack={() => setActiveSquadCode(undefined)}
          />
        ) : activeGroupId ? (
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
            activeSquadCode={activeSquadCode}
            onSelectContact={(pubkey) => {
              setActivePubkey(pubkey);
              setActiveGroupId(undefined);
              setActiveSquadCode(undefined);
            }}
            onSelectGroup={(groupId) => {
              setActiveGroupId(groupId);
              setActivePubkey(undefined);
              setActiveSquadCode(undefined);
            }}
            onSelectSquad={(code) => {
              setActiveSquadCode(code);
              setActivePubkey(undefined);
              setActiveGroupId(undefined);
            }}
          />
        )}
      </main>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onAction={handleCommandAction}
      />

      {/* Modals */}
      {showRelays && <RelayModal onClose={() => setShowRelays(false)} />}
      {showSeed && <SeedBackupModal onClose={() => setShowSeed(false)} />}
      {showThemes && <ThemeSwitcherModal onClose={() => setShowThemes(false)} />}

    </div>
  );
};
