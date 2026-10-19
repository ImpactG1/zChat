import { nip44 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

/**
 * Computes a NIP-44 v2 conversation key derived from ECDH
 * Accepts privkey as Uint8Array or hex string, and pubkey as hex string
 */
export function getConversationKey(privkeyA: string | Uint8Array, pubkeyB: string): Uint8Array {
  const privBytes = typeof privkeyA === 'string' ? hexToBytes(privkeyA) : privkeyA;
  return nip44.v2.utils.getConversationKey(privBytes, pubkeyB);
}

/**
 * Encrypts a plaintext string using NIP-44 v2 (ChaCha20-Poly1305 with padding)
 */
export function encryptPayload(plaintext: string, conversationKey: Uint8Array): string {
  return nip44.v2.encrypt(plaintext, conversationKey);
}

/**
 * Decrypts a NIP-44 v2 ciphertext string
 */
export function decryptPayload(ciphertext: string, conversationKey: Uint8Array): string {
  return nip44.v2.decrypt(ciphertext, conversationKey);
}

/**
 * Direct helper: Encrypts content from Alice to Bob
 */
export function encryptDirect(plaintext: string, senderPrivkey: string | Uint8Array, recipientPubkey: string): string {
  const convKey = getConversationKey(senderPrivkey, recipientPubkey);
  return encryptPayload(plaintext, convKey);
}

/**
 * Direct helper: Decrypts content for Bob sent by Alice
 */
export function decryptDirect(ciphertext: string, recipientPrivkey: string | Uint8Array, senderPubkey: string): string {
  const convKey = getConversationKey(recipientPrivkey, senderPubkey);
  return decryptPayload(ciphertext, convKey);
}
