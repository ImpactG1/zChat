import { unwrapDirectMessage } from '../crypto/nip59';
import { db } from '../storage/db';
import { KeyVault } from '../storage/keyVault';
import { nostrClient } from './client';
import { ChatMessage } from '@/types';
import type { Event as NostrEvent } from 'nostr-tools';

export type OnNewMessageCallback = (msg: ChatMessage) => void;

class MessageReceiverService {
  private unsubscribeFn: (() => void) | null = null;
  private listeners: Set<OnNewMessageCallback> = new Set();
  private processedWraps: Set<string> = new Set();

  public addMessageListener(cb: OnNewMessageCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /**
   * Starts listening for incoming Kind:1059 Gift Wrap events addressed to the user
   */
  public startListening(): void {
    const identity = KeyVault.getIdentity();
    if (!identity) {
      console.warn('Cannot start message listener: No user identity found');
      return;
    }

    if (this.unsubscribeFn) {
      this.unsubscribeFn();
    }

    // Subscribe to Kind: 1059 events addressed to our pubkey
    const filter = {
      kinds: [1059],
      '#p': [identity.pubkey],
      since: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), // last 7 days
    };

    this.unsubscribeFn = nostrClient.subscribeToEvents(filter, async (event: NostrEvent) => {
      await this.handleIncomingWrapEvent(event, identity.privkey, identity.pubkey);
    });
  }

  private async handleIncomingWrapEvent(
    event: NostrEvent,
    myPrivkey: string,
    myPubkey: string
  ): Promise<void> {
    // 1. In-memory and DB deduplication
    if (this.processedWraps.has(event.id)) {
      return;
    }
    this.processedWraps.add(event.id);

    const existing = await db.messages.filter((m) => m.wrapEventId === event.id).first();
    if (existing) {
      return;
    }

    try {
      // 2. Unwrap the onion gift wrap
      const unwrapped = unwrapDirectMessage(event, myPrivkey);

      // Check if sender is blocked
      const contact = await db.contacts.get(unwrapped.senderPubkey);
      if (contact && contact.isBlocked) {
        return; // Drop message from blocked peer
      }

      const message: ChatMessage = {
        id: unwrapped.id || crypto.randomUUID(),
        conversationId: unwrapped.senderPubkey,
        senderPubkey: unwrapped.senderPubkey,
        recipientPubkey: myPubkey,
        content: unwrapped.content,
        timestamp: unwrapped.timestamp || event.created_at * 1000,
        status: 'delivered',
        wrapEventId: event.id,
        retryCount: 0,
      };

      // 3. Save to database
      await db.messages.put(message);

      // 4. Update or create contact record
      if (contact) {
        await db.contacts.update(unwrapped.senderPubkey, {
          lastMessage: unwrapped.content,
          lastTimestamp: message.timestamp,
          unreadCount: contact.unreadCount + 1,
        });
      } else {
        await db.contacts.put({
          pubkey: unwrapped.senderPubkey,
          npub: '',
          alias: `User#${unwrapped.senderPubkey.slice(0, 4)}`,
          tag: `#${unwrapped.senderPubkey.slice(0, 4)}`,
          unreadCount: 1,
          lastMessage: unwrapped.content,
          lastTimestamp: message.timestamp,
          isBlocked: false,
        });
      }

      // 5. Notify in-app subscribers
      this.listeners.forEach((listener) => {
        try {
          listener(message);
        } catch (e) {
          console.error('Error in message listener callback:', e);
        }
      });
    } catch (err) {
      // Event may be encrypted for someone else or corrupted
      console.warn('Failed to unwrap incoming kind:1059 event:', event.id, err);
    }
  }

  public stopListening(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
    this.processedWraps.clear();
  }
}

export const messageReceiver = new MessageReceiverService();
