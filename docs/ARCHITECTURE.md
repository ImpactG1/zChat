# zChat Architecture Documentation

This document outlines the detailed technical architecture, cryptographic specifications, state management, and native Android overlay mechanics of **zChat**.

---

## 1. System Components

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + TypeScript Frontend              │
│  - Gamer HUD Controller (Opacity, Click-Through, Snap)      │
│  - Chat Viewport & Conversations Thread                     │
│  - Relay Manager & Diagnostics Panel                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Zustand & Dexie Core                     │
│  - Dexie.js (IndexedDB): Messages, Contacts, Outbox Queue   │
│  - KeyVault: AES-GCM Encrypted Device Private Key           │
│  - Zustand: Reactive App & HUD States                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Nostr Cryptographic Core                   │
│  - NIP-44 v2 (ChaCha20-Poly1305 + HKDF + Padding)           │
│  - NIP-59 (Gift Wrap / Rumor / Seal Layering)               │
│  - NIP-17 (Private 1:1 Direct Messages)                     │
│  - nostr-tools SimplePool (WebSocket Relay Mesh)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Capacitor Bridge
┌──────────────────────────────▼──────────────────────────────┐
│             Native Android Plugin (`zchat-overlay`)         │
│  - Foreground Service + SYSTEM_ALERT_WINDOW                 │
│  - FloatingBubbleView (Edge Magnetism & Drag Physics)       │
│  - Dynamic WindowManager.LayoutParams (Alpha & Click-Thru)  │
│  - Native Quick-Reply Floating Dialog                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Cryptographic Specifications

### A. Key Derivation & Identity
* **Mnemonic:** 12-word BIP-39 mnemonic seed.
* **Master Seed:** PBKDF2 with SHA-512 (2048 iterations).
* **Keypair:** secp256k1 keypair derived via standard BIP-32/BIP-44 derivation path `m/44'/1237'/0'/0/0` (standard Nostr derivation) or root scalar.
* **Public Identification:**
  - `pubkey`: 32-byte lowercase hex string.
  - `npub`: NIP-19 bech32 encoded string with prefix `npub1...`.
  - `gamerTag`: Display name + 4-character fingerprint of the public key (e.g., `Shadow#3f7b`).

### B. NIP-44 v2 Payload Encryption
All private content is encrypted using NIP-44 version 2:
1. **Shared Secret:** Computed via secp256k1 ECDH between Sender Private Key and Recipient Public Key.
2. **HKDF Derivation:** HKDF-HMAC-SHA256 derives a 32-byte ChaCha20 key and a 12-byte nonce.
3. **Deterministic Padding:** Message lengths are padded to powers of 2 or chunk boundaries to prevent traffic analysis and ciphertext length leakage.
4. **Cipher:** ChaCha20-Poly1305 authenticated encryption with a 16-byte authentication tag.

### C. NIP-59 Gift Wrap Pipeline
To hide metadata (sender identity, recipient identity, conversation graph, and real timestamp) from relay operators:

1. **Rumor (`kind:14`):**
   ```json
   {
     "kind": 14,
     "content": "Encrypted message text or payload",
     "pubkey": "<alice_pubkey>",
     "created_at": <true_timestamp>,
     "tags": [["p", "<bob_pubkey>"]]
   }
   ```
   *(Unsigned by itself to prevent independent broadcast).*

2. **Seal (`kind:13`):**
   - The Rumor string is encrypted using NIP-44 v2 for Bob.
   - Wrapped into an event signed with Alice's true private key:
   ```json
   {
     "kind": 13,
     "pubkey": "<alice_pubkey>",
     "content": "<nip44_encrypted_rumor_for_bob>",
     "created_at": <randomized_skewed_timestamp>,
     "tags": [],
     "sig": "<alice_signature>"
   }
   ```

3. **Gift Wrap (`kind:1059`):**
   - A random one-time throwaway keypair is generated: `(eph_priv, eph_pub)`.
   - The Seal string is encrypted using NIP-44 v2 with `eph_priv` for `bob_pubkey`.
   - The outer event is signed with `eph_priv`:
   ```json
   {
     "kind": 1059,
     "pubkey": "<eph_pubkey>",
     "content": "<nip44_encrypted_seal_for_bob>",
     "created_at": <current_time_plus_random_jitter>,
     "tags": [["p", "<bob_pubkey>"]],
     "sig": "<eph_signature>"
   }
   ```

**Relay View:** The relay only sees that `<eph_pubkey>` (a random, one-time key) sent an encrypted blob to `<bob_pubkey>`. The relay learns nothing about who sent it, what it says, or when it was originally authored.

---

## 3. Android Native Overlay & Gamer HUD Architecture

### WindowManager Configuration
The overlay uses `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`:

```kotlin
val params = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
    WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
    PixelFormat.TRANSLUCENT
)
```

### Game HUD Capabilities
1. **Dynamic Opacity (Ghost Mode):**
   ```kotlin
   fun setOverlayAlpha(alphaPercent: Int) {
       params.alpha = (alphaPercent.coerceIn(10, 100)) / 100f
       windowManager.updateViewLayout(bubbleView, params)
   }
   ```
2. **Click-Through Mode:**
   ```kotlin
   fun setClickThrough(enabled: Boolean) {
       if (enabled) {
           params.flags = params.flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
       } else {
           params.flags = params.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
       }
       windowManager.updateViewLayout(bubbleView, params)
   }
   ```
3. **Magnetic Edge Snapping:**
   On `MotionEvent.ACTION_UP`, an interpolated value animator calculates screen width and smoothly animates the bubble `x` coordinate to `0` (left margin) or `screenWidth - bubbleWidth` (right margin).

---

## 4. Local Database Schema (Dexie.js)

```typescript
// db.ts
export class ZChatDatabase extends Dexie {
  contacts!: Table<Contact, string>;
  messages!: Table<ChatMessage, string>;
  outbox!: Table<OutboxItem, string>;
  relays!: Table<RelayConfig, string>;

  constructor() {
    super('zChatDB');
    this.version(1).stores({
      contacts: 'pubkey, alias, isBlocked',
      messages: 'id, conversationId, timestamp, status, senderPubkey',
      outbox: 'id, timestamp, retryCount',
      relays: 'url, isEnabled'
    });
  }
}
```
