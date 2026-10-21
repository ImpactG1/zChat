import Dexie, { type Table } from 'dexie';
import { Contact, ChatMessage, RelayConfig, OutboxItem, GroupChat, GroupMessage } from '@/types';

export class ZChatDB extends Dexie {
  contacts!: Table<Contact, string>;
  messages!: Table<ChatMessage, string>;
  relays!: Table<RelayConfig, string>;
  outbox!: Table<OutboxItem, string>;
  groups!: Table<GroupChat, string>;
  groupMessages!: Table<GroupMessage, string>;

  constructor() {
    super('zChatDatabase');
    this.version(1).stores({
      contacts: 'pubkey, alias, unreadCount, isBlocked',
      messages: 'id, conversationId, timestamp, status, senderPubkey',
      relays: 'url, isEnabled',
      outbox: 'id, conversationId, timestamp',
    });

    this.version(2).stores({
      contacts: 'pubkey, alias, unreadCount, isBlocked, lastTimestamp',
      messages: 'id, conversationId, timestamp, status, senderPubkey',
      relays: 'url, isEnabled',
      outbox: 'id, conversationId, timestamp',
      groups: 'id, name, adminPubkey, lastTimestamp',
      groupMessages: 'id, groupId, timestamp, senderPubkey',
    });

    this.version(3).stores({
      contacts: 'pubkey, alias, unreadCount, isBlocked, lastTimestamp',
      messages: 'id, conversationId, timestamp, status, senderPubkey',
      relays: 'url, isEnabled',
      outbox: 'id, conversationId, timestamp',
      groups: 'id, name, adminPubkey, lastTimestamp',
      groupMessages: 'id, groupId, timestamp, senderPubkey',
    });
  }
}

export const db = new ZChatDB();

/**
 * Purges old static demo mock keys/users from local storage to ensure
 * a 100% dynamic user experience.
 */
export async function purgeLegacyDemoData(): Promise<void> {
  try {
    const demoPubkeys = [
      '8f3a1109d0e821ba44c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b4',
      'a9c144c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b48f3a1109d0e8',
      '44d2d3e4f5a6b7c87e2a91b48f3a1109d0e821ba44c9b201f8e4a5c6d7e8f9a0',
      '22e8f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b48f3a1109d0e821ba44c9',
      '7e2a91b48f6c3109d0e821ba44c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c8',
    ];

    for (const pk of demoPubkeys) {
      await db.contacts.delete(pk);
      await db.messages.where('conversationId').equals(pk).delete();
    }

    await db.groups.delete('group_sanctum_001');
    await db.groups.delete('group_raid_party');
    await db.groupMessages.where('groupId').equals('group_sanctum_001').delete();
    await db.groupMessages.where('groupId').equals('group_raid_party').delete();
  } catch (err) {
    console.warn('purgeLegacyDemoData non-fatal error:', err);
  }
}
