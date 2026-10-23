import { finalizeEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { nostrClient } from './client';
import { db } from '../storage/db';
import { UserIdentity } from '@/types';
import { syncOverlayChat } from '@/bridge/overlayChatSync';

/**
 * Service for publishing and fetching public Nostr Kind 0 profile metadata.
 * Enables peers to discover warrior titles and tags across relays.
 */
export class ProfileService {
  private static instance: ProfileService;
  private pendingFetches = new Map<string, Promise<{ name?: string; tag?: string } | null>>();

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Publishes the user's warrior covenant and title to active relays (Kind: 0 Metadata)
   */
  public async publishWarriorProfile(identity: UserIdentity): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const metadata = {
        name: identity.displayName,
        display_name: identity.displayName,
        about: `zChat Encrypted Warrior ${identity.tag}`,
        tag: identity.tag,
        nip05: '',
      };

      const eventTemplate = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: [
          ['name', identity.displayName],
          ['tag', identity.tag],
        ],
        created_at: now,
      };

      const signedEvent = finalizeEvent(eventTemplate, hexToBytes(identity.privkey));
      const success = await nostrClient.publishEvent(signedEvent);
      return success;
    } catch (err) {
      console.warn('Failed to publish warrior profile to relays:', err);
      return false;
    }
  }

  /**
   * Fetches a warrior's public Kind: 0 profile from relays.
   * If found, automatically updates contact record in IndexedDB if it currently has a placeholder.
   */
  public async fetchWarriorProfile(
    pubkey: string,
    timeoutMs: number = 3500
  ): Promise<{ name?: string; tag?: string } | null> {
    if (this.pendingFetches.has(pubkey)) {
      return this.pendingFetches.get(pubkey)!;
    }

    const fetchPromise = new Promise<{ name?: string; tag?: string } | null>((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.pendingFetches.delete(pubkey);
          resolve(null);
        }
      }, timeoutMs);

      const cleanup = nostrClient.subscribeToEvents(
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        },
        async (event) => {
          if (resolved) return;
          try {
            const data = JSON.parse(event.content);
            const warriorName = (data.display_name || data.name || '').trim();
            const warriorTag = (data.tag || '').trim() || `#${pubkey.slice(0, 4)}`;

            if (warriorName) {
              resolved = true;
              clearTimeout(timer);
              cleanup();
              this.pendingFetches.delete(pubkey);

              // Update contact in IndexedDB if it exists and has placeholder
              const contact = await db.contacts.get(pubkey);
              if (contact) {
                const isPlaceholder =
                  !contact.alias ||
                  contact.alias.startsWith('User#') ||
                  contact.alias.startsWith('Warrior#') ||
                  contact.alias.startsWith('Viper#') ||
                  contact.alias.startsWith('MEMBER#');

                if (isPlaceholder) {
                  await db.contacts.update(pubkey, {
                    alias: warriorName,
                    tag: warriorTag,
                  });
                  syncOverlayChat().catch(() => {});
                }
              }

              resolve({ name: warriorName, tag: warriorTag });
            }
          } catch {
            // Ignore parse errors on bad events
          }
        }
      );
    });

    this.pendingFetches.set(pubkey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Scans local contacts and updates any remaining "User#..." or "MEMBER#..." placeholders
   * to their real warrior titles from relays.
   */
  public async migratePlaceholderContacts(): Promise<void> {
    try {
      const contacts = await db.contacts.toArray();
      for (const c of contacts) {
        const isPlaceholder =
          !c.alias ||
          c.alias.startsWith('User#') ||
          c.alias.startsWith('MEMBER#');

        if (isPlaceholder) {
          this.fetchWarriorProfile(c.pubkey).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Failed to migrate placeholder contacts:', err);
    }
  }
}

export const profileService = ProfileService.getInstance();
