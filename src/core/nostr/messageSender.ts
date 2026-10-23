import { wrapDirectMessage } from '../crypto/nip59';
import { db } from '../storage/db';
import { KeyVault } from '../storage/keyVault';
import { nostrClient } from './client';
import { ChatMessage, OutboxItem } from '@/types';
import { syncOverlayChat } from '@/bridge/overlayChatSync';
import { profileService } from './profileService';

/**
 * Sends a NIP-17 Gift-Wrapped message to a recipient pubkey
 */
export async function sendDirectMessage(recipientPubkey: string, content: string): Promise<ChatMessage> {
  const identity = KeyVault.getIdentity();
  if (!identity) {
    throw new Error('No user identity configured');
  }

  const messageId = crypto.randomUUID();
  const now = Date.now();

  const chatMessage: ChatMessage = {
    id: messageId,
    conversationId: recipientPubkey,
    senderPubkey: identity.pubkey,
    recipientPubkey,
    content,
    timestamp: now,
    status: 'pending',
    retryCount: 0,
  };

  // 1. Optimistically store in local IndexedDB
  await db.messages.put(chatMessage);
  syncOverlayChat().catch(() => {});

  // 2. Update contact record
  const existingContact = await db.contacts.get(recipientPubkey);
  if (existingContact) {
    await db.contacts.update(recipientPubkey, {
      lastMessage: content,
      lastTimestamp: now,
    });
  } else {
    await db.contacts.put({
      pubkey: recipientPubkey,
      npub: '',
      alias: `Warrior#${recipientPubkey.slice(0, 4)}`,
      tag: `#${recipientPubkey.slice(0, 4)}`,
      unreadCount: 0,
      lastMessage: content,
      lastTimestamp: now,
      isBlocked: false,
    });
    profileService.fetchWarriorProfile(recipientPubkey).catch(() => {});
  }

  // 3. Wrap with NIP-59 (Rumor -> Seal -> Gift Wrap) with sender's warrior handle & tag
  let giftWrapEvent;
  try {
    giftWrapEvent = wrapDirectMessage(
      content,
      identity.privkey,
      recipientPubkey,
      identity.displayName,
      identity.tag
    );
  } catch (err) {
    console.error('Failed to wrap message:', err);
    await db.messages.update(messageId, { status: 'failed' });
    throw err;
  }

  // 4. Publish to relays
  const published = await nostrClient.publishEvent(giftWrapEvent);

  if (published) {
    chatMessage.status = 'sent';
    chatMessage.wrapEventId = giftWrapEvent.id;
    await db.messages.update(messageId, {
      status: 'sent',
      wrapEventId: giftWrapEvent.id,
    });
  } else {
    // Queue in outbox for background retry
    const outboxItem: OutboxItem = {
      id: messageId,
      conversationId: recipientPubkey,
      wrapEventJson: JSON.stringify(giftWrapEvent),
      timestamp: now,
      retryCount: 0,
    };
    await db.outbox.put(outboxItem);
  }

  return chatMessage;
}

/**
 * Retries sending any queued outbox messages
 */
export async function retryOutboxMessages(): Promise<void> {
  const queued = await db.outbox.toArray();
  for (const item of queued) {
    try {
      const event = JSON.parse(item.wrapEventJson);
      const published = await nostrClient.publishEvent(event);
      if (published) {
        await db.messages.update(item.id, { status: 'sent', wrapEventId: event.id });
        await db.outbox.delete(item.id);
      } else {
        await db.outbox.update(item.id, { retryCount: item.retryCount + 1 });
      }
    } catch (err) {
      console.error('Failed to retry outbox item:', item.id, err);
    }
  }
}
