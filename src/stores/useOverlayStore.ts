import { create } from 'zustand';
import { OverlayConfig } from '@/types';
import { OverlayBridge } from '@/bridge/overlayBridge';

interface OverlayState extends OverlayConfig {
  hasPermission: boolean;
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<void>;
  toggleOverlay: () => Promise<void>;
  setOpacity: (val: number) => Promise<void>;
  toggleClickThrough: () => Promise<void>;
  setActiveConversation: (pubkey?: string) => void;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  isEnabled: false,
  opacity: 85,
  isClickThrough: false,
  snapToEdge: true,
  hasPermission: false,
  activeConversationId: undefined,

  checkPermission: async () => {
    const granted = await OverlayBridge.hasPermission();
    set({ hasPermission: granted });
    return granted;
  },

  requestPermission: async () => {
    await OverlayBridge.requestPermission();
    // Recheck after setting action
    setTimeout(async () => {
      const granted = await OverlayBridge.hasPermission();
      set({ hasPermission: granted });
    }, 1500);
  },

  toggleOverlay: async () => {
    const current = get().isEnabled;
    const next = !current;
    if (next) {
      const granted = await get().checkPermission();
      if (!granted) {
        await get().requestPermission();
        return;
      }
      await OverlayBridge.show({
        opacity: get().opacity,
        isClickThrough: get().isClickThrough,
      });
      set({ isEnabled: true });
    } else {
      await OverlayBridge.hide();
      set({ isEnabled: false });
    }
  },

  setOpacity: async (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    set({ opacity: clamped });
    await OverlayBridge.setOpacity(clamped);
  },

  toggleClickThrough: async () => {
    const next = !get().isClickThrough;
    set({ isClickThrough: next });
    await OverlayBridge.setClickThrough(next);
  },

  setActiveConversation: (pubkey?: string) => {
    set({ activeConversationId: pubkey });
  },
}));
