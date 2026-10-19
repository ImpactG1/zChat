import { create } from 'zustand';
import { RelayConfig } from '@/types';
import { db } from '@/core/storage/db';
import { initializeRelays } from '@/core/nostr/relays';
import { nostrClient } from '@/core/nostr/client';

interface RelayState {
  relays: RelayConfig[];
  isLoading: boolean;
  loadRelays: () => Promise<void>;
  toggleRelay: (url: string) => Promise<void>;
  addRelay: (url: string) => Promise<boolean>;
  removeRelay: (url: string) => Promise<void>;
  pingAll: () => Promise<void>;
}

export const useRelayStore = create<RelayState>((set, get) => ({
  relays: [],
  isLoading: false,

  loadRelays: async () => {
    set({ isLoading: true });
    const list = await initializeRelays();
    set({ relays: list, isLoading: false });
    get().pingAll();
  },

  toggleRelay: async (url: string) => {
    const relay = await db.relays.get(url);
    if (!relay) return;
    const updated = !relay.isEnabled;
    await db.relays.update(url, { isEnabled: updated });
    set({
      relays: get().relays.map((r) => (r.url === url ? { ...r, isEnabled: updated } : r)),
    });
  },

  addRelay: async (url: string) => {
    let clean = url.trim();
    if (!clean.startsWith('wss://') && !clean.startsWith('ws://')) {
      clean = `wss://${clean}`;
    }
    const existing = await db.relays.get(clean);
    if (existing) return false;

    const newRelay: RelayConfig = {
      url: clean,
      isEnabled: true,
      status: 'connecting',
    };
    await db.relays.put(newRelay);
    set({ relays: [...get().relays, newRelay] });

    // Measure ping
    const latency = await nostrClient.pingRelay(clean);
    await db.relays.update(clean, {
      latencyMs: latency ?? undefined,
      status: latency !== null ? 'connected' : 'error',
    });
    set({
      relays: get().relays.map((r) =>
        r.url === clean
          ? { ...r, latencyMs: latency ?? undefined, status: latency !== null ? 'connected' : 'error' }
          : r
      ),
    });
    return true;
  },

  removeRelay: async (url: string) => {
    await db.relays.delete(url);
    set({ relays: get().relays.filter((r) => r.url !== url) });
  },

  pingAll: async () => {
    const list = get().relays;
    for (const r of list) {
      if (r.isEnabled) {
        nostrClient.pingRelay(r.url).then((latency) => {
          db.relays.update(r.url, {
            latencyMs: latency ?? undefined,
            status: latency !== null ? 'connected' : 'error',
          });
          set({
            relays: get().relays.map((curr) =>
              curr.url === r.url
                ? { ...curr, latencyMs: latency ?? undefined, status: latency !== null ? 'connected' : 'error' }
                : curr
            ),
          });
        });
      }
    }
  },
}));
