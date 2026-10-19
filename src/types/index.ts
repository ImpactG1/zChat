/**
 * zChat Core Types & Schemas
 */

export interface UserIdentity {
  pubkey: string;            // 64-char hex pubkey (identity)
  npub: string;              // NIP-19 bech32 encoded
  privkey: string;           // 64-char hex private key
  mnemonic?: string;         // 12-word recovery seed
  displayName: string;       // Custom nickname (e.g. "Viper")
  tag: string;               // 4-char fingerprint (e.g. "#8f3a")
  createdAt: number;
}

export interface Contact {
  pubkey: string;
  npub: string;
  alias: string;
  tag: string;
  unreadCount: number;
  lastMessage?: string;
  lastTimestamp?: number;
  isBlocked: boolean;
}

export type MessageDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface ChatMessage {
  id: string;                // Local UUID or Event ID
  conversationId: string;    // Peer's pubkey
  senderPubkey: string;      // True author pubkey
  recipientPubkey: string;   // Recipient pubkey
  content: string;           // Plaintext content
  timestamp: number;         // Milliseconds
  status: MessageDeliveryStatus;
  wrapEventId?: string;      // Nostr Kind:1059 event ID
  retryCount: number;
}

export interface RelayConfig {
  url: string;
  isEnabled: boolean;
  latencyMs?: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastSeen?: number;
}

export interface OverlayConfig {
  isEnabled: boolean;
  opacity: number;           // 10 to 100
  isClickThrough: boolean;
  snapToEdge: boolean;
  activeConversationId?: string;
}

export interface OutboxItem {
  id: string;                // Message ID
  conversationId: string;
  wrapEventJson: string;     // Serialized Kind:1059 event
  timestamp: number;
  retryCount: number;
}

export interface GroupChat {
  id: string;                // Group UUID / Topic ID
  name: string;              // "Squad Alpha", "Raid Party", etc.
  adminPubkey: string;       // Party Leader (controls membership & key rotation)
  currentEpoch: number;      // Epoch index for key rotation
  groupKeyHex: string;       // 32-byte shared epoch symmetric encryption key
  members: string[];         // Member pubkeys
  createdAt: number;
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderPubkey: string;
  senderTag: string;
  content: string;
  timestamp: number;
  epoch: number;
  status: MessageDeliveryStatus;
}

export type GamerTheme = 'cyberpunk' | 'tactical' | 'crimson' | 'stealth';

