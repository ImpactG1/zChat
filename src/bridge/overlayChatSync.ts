import { db } from '@/core/storage/db';
import { OverlayBridge } from './overlayBridge';

let syncDebounceTimer: any = null;
let currentActivePubkey: string | undefined = undefined;

export function setActiveOverlayConversation(pubkey?: string): void {
  currentActivePubkey = pubkey;
}

/**
 * Synchronizes the active conversation, contacts list for switching, and unread count
 * to the native/desktop overlay with Portal UI metadata.
 */
export async function syncOverlayChat(preferredPubkey?: string): Promise<void> {
  if (preferredPubkey) {
    currentActivePubkey = preferredPubkey;
  }

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(async () => {
    try {
      const contacts = await db.contacts.toArray();
      const groups = await db.groups.toArray();

      const unreadTotal =
        contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0) +
        groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0);

      // Build unified conversation list for the Maximized chat switcher
      const contactsList = [
        ...groups.map((g) => ({
          pubkey: g.id,
          alias: g.name ? g.name : 'Squad',
          tag: `#SQUAD`,
          unreadCount: g.unreadCount || 0,
          lastTimestamp: g.lastTimestamp || 0,
          isGroup: true,
        })),
        ...contacts.map((c) => ({
          pubkey: c.pubkey,
          alias: c.alias || `Warrior#${c.pubkey.slice(0, 4)}`,
          tag: c.tag || `#${c.pubkey.slice(0, 4)}`,
          unreadCount: c.unreadCount || 0,
          lastTimestamp: c.lastTimestamp || 0,
          isGroup: false,
        })),
      ].sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      // Determine active conversation
      let activeItem = contactsList.find((c) => c.pubkey === currentActivePubkey);
      if (!activeItem && contactsList.length > 0) {
        activeItem = contactsList[0];
        currentActivePubkey = activeItem.pubkey;
      }

      let channelTitle = 'ZENYTH';
      let messagesJson = '[]';
      const activePubkey = activeItem?.pubkey || '';

      const formatTime = (ts: number) => {
        try {
          const d = new Date(ts);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch {
          return '';
        }
      };

      if (activeItem) {
        channelTitle = activeItem.alias;
        if (activeItem.isGroup) {
          const groupMsgs = await db.groupMessages
            .where('groupId')
            .equals(activeItem.pubkey)
            .sortBy('timestamp');

          messagesJson = JSON.stringify(
            groupMsgs.slice(-35).map((m) => {
              const isMe = m.authorAlias === 'You';
              return {
                id: m.id,
                senderName: isMe ? 'You' : (m.authorAlias || m.senderTag || 'Teammate'),
                senderTag: isMe ? '' : (m.senderTag || '#PEER'),
                content: m.content,
                isMe,
                timestamp: m.timestamp,
                time: formatTime(m.timestamp),
              };
            })
          );
        } else {
          const msgs = await db.messages
            .where('conversationId')
            .equals(activeItem.pubkey)
            .sortBy('timestamp');

          messagesJson = JSON.stringify(
            msgs.slice(-35).map((m) => {
              const isMe = m.senderPubkey !== activeItem!.pubkey;
              return {
                id: m.id,
                senderName: isMe ? 'You' : activeItem!.alias,
                senderTag: isMe ? '' : activeItem!.tag,
                content: m.content,
                isMe,
                timestamp: m.timestamp,
                time: formatTime(m.timestamp),
              };
            })
          );
        }
      }

      const contactsJson = JSON.stringify(
        contactsList.map((c) => ({
          pubkey: c.pubkey,
          alias: c.alias,
          tag: c.tag,
          unreadCount: c.unreadCount,
          isGroup: c.isGroup,
        }))
      );

      await OverlayBridge.updateChatData(channelTitle, messagesJson, activePubkey, contactsJson);
      await OverlayBridge.updateBadge(unreadTotal);
    } catch (err) {
      console.warn('Failed to sync overlay chat:', err);
    }
  }, 40);
}
