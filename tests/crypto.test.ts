import { describe, it, expect } from 'vitest';
import { createNewIdentity, restoreIdentityFromMnemonic, parsePubkeyInput } from '../src/core/crypto/keys';
import { encryptDirect, decryptDirect } from '../src/core/crypto/nip44';
import { wrapDirectMessage, unwrapDirectMessage } from '../src/core/crypto/nip59';

describe('zChat Cryptographic Engine', () => {
  it('generates a valid 12-word identity and restores deterministically', () => {
    const user1 = createNewIdentity('Viper');
    expect(user1.mnemonic).toBeDefined();
    expect(user1.mnemonic?.split(' ').length).toBe(12);
    expect(user1.pubkey).toMatch(/^[0-9a-f]{64}$/);
    expect(user1.npub).toMatch(/^npub1/);
    expect(user1.tag).toMatch(/^#[0-9a-f]{4}$/);

    // Restoring with the same mnemonic should produce the exact same pubkey
    const restored = restoreIdentityFromMnemonic(user1.mnemonic!, 'Viper');
    expect(restored.pubkey).toBe(user1.pubkey);
    expect(restored.npub).toBe(user1.npub);
    expect(restored.privkey).toBe(user1.privkey);
  });

  it('correctly parses hex and npub user inputs', () => {
    const user = createNewIdentity('Phoenix');
    expect(parsePubkeyInput(user.pubkey)).toBe(user.pubkey);
    expect(parsePubkeyInput(user.npub)).toBe(user.pubkey);
    expect(parsePubkeyInput('invalid_key')).toBeNull();
  });

  it('performs authenticated NIP-44 v2 payload encryption and decryption', () => {
    const alice = createNewIdentity('Alice');
    const bob = createNewIdentity('Bob');
    const message = 'Enemy spotted at Site B! Hold positions.';

    // Alice encrypts for Bob
    const ciphertext = encryptDirect(message, alice.privkey, bob.pubkey);
    expect(ciphertext).not.toBe(message);
    expect(ciphertext.length).toBeGreaterThan(message.length);

    // Bob decrypts from Alice
    const decrypted = decryptDirect(ciphertext, bob.privkey, alice.pubkey);
    expect(decrypted).toBe(message);
  });

  it('performs full NIP-59 onion Gift Wrapping and unwrap', () => {
    const alice = createNewIdentity('Alice');
    const bob = createNewIdentity('Bob');
    const originalText = 'GG! Meet in the party lobby.';

    // Alice wraps for Bob
    const giftWrap = wrapDirectMessage(originalText, alice.privkey, bob.pubkey);
    expect(giftWrap.kind).toBe(1059);
    // Outer event does NOT expose Alice's pubkey
    expect(giftWrap.pubkey).not.toBe(alice.pubkey);
    // Outer event recipient is Bob
    const pTag = giftWrap.tags.find((t) => t[0] === 'p');
    expect(pTag?.[1]).toBe(bob.pubkey);

    // Bob unwraps the gift wrap
    const unwrapped = unwrapDirectMessage(giftWrap, bob.privkey);
    expect(unwrapped.content).toBe(originalText);
    expect(unwrapped.senderPubkey).toBe(alice.pubkey);
  });
});
