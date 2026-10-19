import { SimplePool, type Event as NostrEvent, type Filter } from 'nostr-tools';
import { getActiveRelays } from './relays';

export class NostrPoolManager {
  private static instance: NostrPoolManager;
  private pool: SimplePool;

  private constructor() {
    this.pool = new SimplePool();
  }

  public static getInstance(): NostrPoolManager {
    if (!NostrPoolManager.instance) {
      NostrPoolManager.instance = new NostrPoolManager();
    }
    return NostrPoolManager.instance;
  }

  /**
   * Publishes an event to all active relays concurrently
   * Resolves when at least one relay successfully accepts the event
   */
  public async publishEvent(event: NostrEvent, customRelays?: string[]): Promise<boolean> {
    const relays = customRelays && customRelays.length > 0 ? customRelays : await getActiveRelays();
    if (relays.length === 0) {
      throw new Error('No active relays available to publish event');
    }

    try {
      const promises = this.pool.publish(relays, event);
      // Wait for at least one relay to accept
      const results = await Promise.allSettled(promises);
      const successful = results.some((r) => r.status === 'fulfilled');
      return successful;
    } catch (err) {
      console.error('Failed to publish event to relays:', err);
      return false;
    }
  }

  /**
   * Creates a multi-relay subscription with an onEvent callback
   */
  public subscribeToEvents(
    filter: Filter,
    onEvent: (event: NostrEvent) => void,
    customRelays?: string[]
  ): () => void {
    let isClosed = false;

    // Async setup
    (async () => {
      const relays = customRelays && customRelays.length > 0 ? customRelays : await getActiveRelays();
      if (relays.length === 0 || isClosed) return;

      const sub = this.pool.subscribeMany(relays, filter, {
        onevent(event) {
          if (!isClosed) {
            onEvent(event);
          }
        },
        oneose() {
          // End of stored events, live mode continues
        },
      });

      if (isClosed) {
        sub.close();
      }
    })();

    // Cleanup function
    return () => {
      isClosed = true;
    };
  }

  /**
   * Measures WebSocket round-trip latency to a specific relay
   */
  public async pingRelay(url: string, timeoutMs: number = 5000): Promise<number | null> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let finished = false;

      try {
        const ws = new WebSocket(url);
        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            try { ws.close(); } catch {}
            resolve(null);
          }
        }, timeoutMs);

        ws.onopen = () => {
          if (!finished) {
            finished = true;
            const latency = Math.round(performance.now() - startTime);
            clearTimeout(timer);
            try { ws.close(); } catch {}
            resolve(latency);
          }
        };

        ws.onerror = () => {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve(null);
          }
        };
      } catch {
        resolve(null);
      }
    });
  }

  public destroy(): void {
    this.pool.destroy();
  }
}

export const nostrClient = NostrPoolManager.getInstance();
