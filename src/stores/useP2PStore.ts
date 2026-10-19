import { create } from 'zustand';
import { p2pManager } from '@/core/p2p/p2pManager';
import { P2PMessage, SquadRoomState } from '@/core/p2p/types';
import { useAuthStore } from './useAuthStore';

interface P2PState {
  roomState: SquadRoomState;
  messages: P2PMessage[];
  isInitialized: boolean;
  init: () => void;
  createSquad: (customCode?: string) => Promise<string>;
  joinSquad: (code: string) => Promise<void>;
  leaveSquad: () => void;
  sendMessage: (text: string) => Promise<void>;
}

export const useP2PStore = create<P2PState>((set, get) => ({
  roomState: p2pManager.getRoomState(),
  messages: [],
  isInitialized: false,

  init: () => {
    if (get().isInitialized) return;

    const identity = useAuthStore.getState().identity;
    if (identity) {
      p2pManager.initUser(identity);
    }

    p2pManager.subscribeState((roomState) => {
      set({ roomState });
    });

    p2pManager.subscribeMessages((message) => {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    });

    set({ isInitialized: true });
  },

  createSquad: async (customCode?: string) => {
    get().init();
    const identity = useAuthStore.getState().identity;
    if (identity) {
      p2pManager.initUser(identity);
    }

    // Generate clean 6-digit squad code if not specified
    const code =
      customCode?.trim().toUpperCase() ||
      `SQUAD-${Math.floor(10 + Math.random() * 90)}`;

    set({ messages: [] });
    await p2pManager.joinSquadRoom(code, true);
    return code;
  },

  joinSquad: async (code: string) => {
    get().init();
    const identity = useAuthStore.getState().identity;
    if (identity) {
      p2pManager.initUser(identity);
    }

    const cleanCode = code.trim().toUpperCase();
    set({ messages: [] });
    await p2pManager.joinSquadRoom(cleanCode, false);
  },

  leaveSquad: () => {
    p2pManager.leaveSquadRoom();
    set({ messages: [] });
  },

  sendMessage: async (text: string) => {
    if (!text.trim()) return;
    await p2pManager.sendChatMessage(text.trim());
  },
}));
