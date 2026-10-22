import { db } from '@/core/storage/db';
import { OverlayBridge } from './overlayBridge';

let syncDebounceTimer: any = null;

/**
 * Synchronizes the most recent conversation and unread count to the native/desktop overlay.
 * Automatically called when incoming messages arrive or outgoing messages are sent.
 */
export async function syncOverlayChat(): Promise<void> {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(async () => {
    try {
      const contacts = await db.contacts.toArray();
      const unreadTotal = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

      // Check both contacts and groups to see which had the most recent activity
      const latestContact = await db.contacts.orderBy('lastTimestamp').reverse().first();
      const latestGroup = await db.groups.orderBy('lastTimestamp').reverse().first();

      let isGroup = false;
      if (latestGroup && latestContact) {
        isGroup = (latestGroup.lastTimestamp || 0) > (latestContact.lastTimestamp || 0);
      } else if (latestGroup && !latestContact) {
        isGroup = true;
      }

      let channelTitle = 'ZENYTH HUD';
      let messagesJson = '[]';

      if (isGroup && latestGroup) {
        channelTitle = latestGroup.name ? `SANCTUM // ${latestGroup.name}` : 'SANCTUM SQUAD';
        const groupMsgs = await db.groupMessages
          .where('groupId')
          .equals(latestGroup.id)
          .sortBy('timestamp');

        messagesJson = JSON.stringify(
          groupMsgs.slice(-25).map((m) => ({
            id: m.id,
            senderTag: m.authorAlias || m.senderTag || 'Teammate',
            content: m.content,
            isMe: m.authorAlias === 'You',
            timestamp: m.timestamp,
          }))
        );
      } else if (latestContact) {
        channelTitle = latestContact.alias || 'TEAMMATE';
        const msgs = await db.messages
          .where('conversationId')
          .equals(latestContact.pubkey)
          .sortBy('timestamp');

        messagesJson = JSON.stringify(
          msgs.slice(-25).map((m) => ({
            id: m.id,
            senderTag: m.senderPubkey === latestContact.pubkey ? (latestContact.alias || 'Teammate') : 'You',
            content: m.content,
            isMe: m.senderPubkey !== latestContact.pubkey,
            timestamp: m.timestamp,
          }))
        );
      }

      await OverlayBridge.updateChatData(channelTitle, messagesJson);
      await OverlayBridge.updateBadge(unreadTotal);
    } catch (err) {
      console.warn('Failed to sync overlay chat:', err);
    }
  }, 50);
}
