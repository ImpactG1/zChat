import { create } from 'zustand';
import { OverlayConfig } from '@/types';
import { OverlayBridge } from '@/bridge/overlayBridge';
import { db } from '@/core/storage/db';
import { sendDirectMessage } from '@/core/nostr/messageSender';
import { syncOverlayChat } from '@/bridge/overlayChatSync';

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

      let channelTitle = 'ZENYTH HUD';
      let messagesJson = '[]';
      try {
        const contact = await db.contacts.orderBy('lastTimestamp').reverse().first();
        if (contact) {
          channelTitle = contact.alias;
          const msgs = await db.messages.where('conversationId').equals(contact.pubkey).sortBy('timestamp');
          messagesJson = JSON.stringify(
            msgs.slice(-5).map((m) => ({
              senderTag: m.senderPubkey === contact.pubkey ? contact.alias : 'You',
              content: m.content,
              isMe: m.senderPubkey !== contact.pubkey,
            }))
          );
        }
      } catch {}

      await OverlayBridge.show({
        opacity: get().opacity,
        isClickThrough: get().isClickThrough,
        channelTitle,
        recentMessagesJson: messagesJson,
      });

      // Hook up message listener for replies sent from native floating overlay
      OverlayBridge.initMessageListener(async (text) => {
        try {
          const activeId = get().activeConversationId;
          const contact = activeId
            ? await db.contacts.get(activeId)
            : await db.contacts.orderBy('lastTimestamp').reverse().first();

          if (contact) {
            await sendDirectMessage(contact.pubkey, text);
          }
          await syncOverlayChat(activeId);
        } catch (err) {
          console.error('Failed to send direct message from overlay listener:', err);
        }
      });

      // Hook up contact selection from Maximized native HUD
      OverlayBridge.initContactSelectListener(async (pubkey) => {
        get().setActiveConversation(pubkey);
      });

      // Synchronize full messages history immediately
      await syncOverlayChat();

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
    syncOverlayChat(pubkey).catch(() => {});
  },
}));
