import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { getPublicKey, nip19 } from 'nostr-tools';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha2';
import { UserIdentity } from '@/types';

/**
 * Derives a deterministic 32-byte private key from a 12-word BIP-39 mnemonic seed
 */
export function derivePrivateKeyFromMnemonic(mnemonic: string): string {
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid BIP-39 mnemonic phrase');
  }
  const seed = mnemonicToSeedSync(mnemonic);
  // Hash the seed with Nostr salt to produce a secure 32-byte scalar
  const privkeyBytes = sha256(new Uint8Array([...seed, ...new TextEncoder().encode('nostr-identity')]));
  return bytesToHex(privkeyBytes);
}

/**
 * Creates a brand new 12-word seed and generates identity
 */
export function createNewIdentity(displayName: string = 'Gamer'): UserIdentity {
  const mnemonic = generateMnemonic(wordlist, 128); // 12 words
  const privkey = derivePrivateKeyFromMnemonic(mnemonic);
  const pubkey = getPublicKey(hexToBytes(privkey));
  const npub = nip19.npubEncode(pubkey);
  const tag = `#${pubkey.slice(0, 4)}`;

  return {
    pubkey,
    npub,
    privkey,
    mnemonic,
    displayName,
    tag,
    createdAt: Date.now(),
  };
}

/**
 * Restores an existing identity from a 12-word seed
 */
export function restoreIdentityFromMnemonic(mnemonic: string, displayName: string = 'Gamer'): UserIdentity {
  const cleanMnemonic = mnemonic.trim().toLowerCase();
  const privkey = derivePrivateKeyFromMnemonic(cleanMnemonic);
  const pubkey = getPublicKey(hexToBytes(privkey));
  const npub = nip19.npubEncode(pubkey);
  const tag = `#${pubkey.slice(0, 4)}`;

  return {
    pubkey,
    npub,
    privkey,
    mnemonic: cleanMnemonic,
    displayName,
    tag,
    createdAt: Date.now(),
  };
}

/**
 * Derives pubkey and npub from an existing raw hex private key
 */
export function identityFromPrivateKey(privkey: string, displayName: string = 'Gamer'): UserIdentity {
  const pubkey = getPublicKey(hexToBytes(privkey));
  const npub = nip19.npubEncode(pubkey);
  const tag = `#${pubkey.slice(0, 4)}`;

  return {
    pubkey,
    npub,
    privkey,
    displayName,
    tag,
    createdAt: Date.now(),
  };
}

/**
 * Parses user input (npub or 64-char hex) and returns standard 64-char hex pubkey
 */
export function parsePubkeyInput(input: string): string | null {
  const cleaned = input.trim();
  if (/^[0-9a-fA-F]{64}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  if (cleaned.startsWith('npub1')) {
    try {
      const decoded = nip19.decode(cleaned);
      if (decoded.type === 'npub') {
        return decoded.data as string;
      }
    } catch {
      return null;
    }
  }
  return null;
}
