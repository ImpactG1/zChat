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
 * Parses user input (npub, nostr:npub, invite text, or 64-char hex) and returns standard 64-char hex pubkey
 */
export function parsePubkeyInput(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim();

  // 1. Direct 64-character hex
  if (/^[0-9a-fA-F]{64}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }

  // 2. Check for npub in string (supports raw npub, nostr:npub1..., "Name: npub1...", etc.)
  const npubMatch = cleaned.match(/(?:nostr:)?(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/i);
  if (npubMatch) {
    try {
      const decoded = nip19.decode(npubMatch[1].toLowerCase());
      if (decoded.type === 'npub') {
        return decoded.data as string;
      }
    } catch {
      return null;
    }
  }

  // 3. Check for pubkey query parameter in invite URLs (e.g. zchat://invite?pubkey=...)
  const hexMatch = cleaned.match(/[?&]pubkey=([0-9a-fA-F]{64})/i);
  if (hexMatch) {
    return hexMatch[1].toLowerCase();
  }

  return null;
}

/**
 * Parses user input to extract both the 64-char pubkey and any suggested warrior title
 * e.g. "Viper: npub1..." -> { pubkey: "...", suggestedAlias: "Viper" }
 */
export function parsePubkeyAndAlias(input: string): { pubkey: string | null; suggestedAlias?: string } {
  const pubkey = parsePubkeyInput(input);
  if (!pubkey) return { pubkey: null };

  let suggestedAlias: string | undefined = undefined;
  const trimmed = input.trim();

  // Case A: "Name: npub1..."
  if (trimmed.includes(':')) {
    const prefix = trimmed.split(':')[0].trim();
    if (prefix && !prefix.toLowerCase().startsWith('nostr') && !prefix.toLowerCase().startsWith('http') && !prefix.toLowerCase().startsWith('zchat')) {
      suggestedAlias = prefix;
    }
  }
  // Case B: "Name (npub1...)"
  else if (trimmed.includes('(') && trimmed.includes(')')) {
    const match = trimmed.match(/^([^(]+)\s*\(/);
    if (match && match[1].trim()) {
      suggestedAlias = match[1].trim();
    }
  }
  // Case C: URL param "name=Viper"
  else if (trimmed.includes('name=')) {
    const match = trimmed.match(/[?&]name=([^&#]+)/);
    if (match) {
      suggestedAlias = decodeURIComponent(match[1]).trim();
    }
  }

  return { pubkey, suggestedAlias };
}
