import Dexie, { type Table } from 'dexie';
import { Contact, ChatMessage, RelayConfig, OutboxItem } from '@/types';

export class ZChatDB extends Dexie {
  contacts!: Table<Contact, string>;
  messages!: Table<ChatMessage, string>;
  relays!: Table<RelayConfig, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super('zChatDatabase');
    this.version(1).stores({
      contacts: 'pubkey, alias, unreadCount, isBlocked',
      messages: 'id, conversationId, timestamp, status, senderPubkey',
      relays: 'url, isEnabled',
      outbox: 'id, conversationId, timestamp',
    });
  }
}

export const db = new ZChatDB();
