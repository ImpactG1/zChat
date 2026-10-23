import { wrapEvent, unwrapEvent } from 'nostr-tools/nip59';
import { hexToBytes } from '@noble/hashes/utils';
import type { Event as NostrEvent } from 'nostr-tools';

export interface UnwrappedMessage {
  id: string;
  senderPubkey: string;
  recipientPubkey: string;
  content: string;
  timestamp: number;
  senderName?: string;
  senderTag?: string;
}

/**
 * Wraps a private direct message (Kind 14 Rumor -> Kind 13 Seal -> Kind 1059 Gift Wrap)
 * Transmits the sender's warrior handle and tag safely inside the E2EE onion seal
 */
export function wrapDirectMessage(
  content: string,
  senderPrivkeyHex: string,
  recipientPubkeyHex: string,
  senderName?: string,
  senderTag?: string
): NostrEvent {
  const senderKeyBytes = hexToBytes(senderPrivkeyHex);
  const now = Math.floor(Date.now() / 1000);

  const tags: string[][] = [['p', recipientPubkeyHex]];
  if (senderName && senderName.trim()) {
    tags.push(['name', senderName.trim()]);
    tags.push(['alias', senderName.trim()]);
  }
  if (senderTag && senderTag.trim()) {
    tags.push(['tag', senderTag.trim()]);
  }

  const rumorTemplate = {
    kind: 14,
    content,
    tags,
    created_at: now,
  };

  return wrapEvent(rumorTemplate, senderKeyBytes, recipientPubkeyHex);
}

/**
 * Unwraps an incoming Kind:1059 Gift Wrap event
 */
export function unwrapDirectMessage(
  wrappedEvent: NostrEvent,
  recipientPrivkeyHex: string
): UnwrappedMessage {
  const recipientKeyBytes = hexToBytes(recipientPrivkeyHex);
  const unwrapped = unwrapEvent(wrappedEvent, recipientKeyBytes);

  // Extract recipient from tags if present
  const pTag = unwrapped.tags.find((t) => t[0] === 'p');
  const recipientPubkey = pTag ? pTag[1] : '';

  // Extract sender warrior handle and tag from encrypted rumor tags
  const nameTag = unwrapped.tags.find((t) => t[0] === 'name' || t[0] === 'alias');
  const tagTag = unwrapped.tags.find((t) => t[0] === 'tag');

  return {
    id: unwrapped.id || wrappedEvent.id,
    senderPubkey: unwrapped.pubkey,
    recipientPubkey,
    content: unwrapped.content,
    timestamp: (unwrapped.created_at || wrappedEvent.created_at) * 1000,
    senderName: nameTag ? nameTag[1] : undefined,
    senderTag: tagTag ? tagTag[1] : undefined,
  };
}
