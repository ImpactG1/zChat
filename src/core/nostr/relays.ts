import { db } from '../storage/db';
import { RelayConfig } from '@/types';

export const DEFAULT_RELAYS: string[] = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.mom',
  'wss://relay.primal.net',
];

/**
 * Ensures default relays are populated in local storage
 */
export async function initializeRelays(): Promise<RelayConfig[]> {
  const existing = await db.relays.toArray();
  if (existing.length === 0) {
    const defaults: RelayConfig[] = DEFAULT_RELAYS.map((url) => ({
      url,
      isEnabled: true,
      status: 'disconnected',
    }));
    await db.relays.bulkAdd(defaults);
    return defaults;
  }
  return existing;
}

/**
 * Gets currently active relay URLs
 */
export async function getActiveRelays(): Promise<string[]> {
  const relays = await db.relays.filter((r) => r.isEnabled).toArray();
  return relays.map((r) => r.url);
}
