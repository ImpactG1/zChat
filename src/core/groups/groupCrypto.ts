import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';

/**
 * Generates a fresh 32-byte symmetric group key
 */
export function generateGroupKey(): string {
  return bytesToHex(randomBytes(32));
}

/**
 * Encrypts a group message payload with ChaCha20-Poly1305
 * Formats output as Base64 of: [12-byte random nonce] + [ciphertext with 16-byte auth tag]
 */
export function encryptGroupMessage(plaintext: string, groupKeyHex: string): string {
  const key = hexToBytes(groupKeyHex);
  const nonce = randomBytes(12);
  const cipher = chacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(new TextEncoder().encode(plaintext));

  // Combine nonce + ciphertext
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a group message payload
 */
export function decryptGroupMessage(encodedPayload: string, groupKeyHex: string): string {
  const key = hexToBytes(groupKeyHex);
  const binaryString = atob(encodedPayload);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  if (combined.length < 28) {
    throw new Error('Group ciphertext too short');
  }

  const nonce = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const cipher = chacha20poly1305(key, nonce);
  const decryptedBytes = cipher.decrypt(ciphertext);

  return new TextDecoder().decode(decryptedBytes);
}
