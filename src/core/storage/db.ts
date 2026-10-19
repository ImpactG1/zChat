import Dexie, { type Table } from 'dexie';
import { Contact, ChatMessage, RelayConfig, OutboxItem } from '@/types';

export class ZChatDB extends Dexie {
  contacts!: Table<Contact, string>;
  messages!: Table<ChatMessage, string>;
  relays!: Table<RelayConfig, string>;
  outbox!: Table<OutboxItem, string>;
  groups!: Table<any, string>;
  groupMessages!: Table<any, string>;

  constructor() {
    super('zChatDatabase');
    this.version(1).stores({
      contacts: 'pubkey, alias, unreadCount, isBlocked',
      messages: 'id, conversationId, timestamp, status, senderPubkey',
      relays: 'url, isEnabled',
      outbox: 'id, conversationId, timestamp',
    });

    this.version(2).stores({
      contacts: 'pubkey, alias, unreadCount, isBlocked',
      messages: 'id, conversationId, timestamp, status, senderPubkey',
      relays: 'url, isEnabled',
      outbox: 'id, conversationId, timestamp',
      groups: 'id, name, adminPubkey, lastTimestamp',
      groupMessages: 'id, groupId, timestamp, senderPubkey',
    });
  }
}

export const db = new ZChatDB();
