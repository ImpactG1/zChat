import { create } from 'zustand';
import { UserIdentity } from '@/types';
import { KeyVault } from '@/core/storage/keyVault';
import { createNewIdentity, restoreIdentityFromMnemonic } from '@/core/crypto/keys';
import { messageReceiver } from '@/core/nostr/messageReceiver';
import { profileService } from '@/core/nostr/profileService';

interface AuthState {
  identity: UserIdentity | null;
  isInitialized: boolean;
  init: () => void;
  createAccount: (displayName: string) => UserIdentity;
  setIdentity: (identity: UserIdentity) => void;
  importAccount: (mnemonic: string, displayName: string) => UserIdentity;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  identity: null,
  isInitialized: false,

  init: () => {
    const existing = KeyVault.getIdentity();
    set({ identity: existing, isInitialized: true });
    if (existing) {
      messageReceiver.startListening();
      // Publish Kind 0 profile so relays have latest warrior handle and migrate any old placeholders
      profileService.publishWarriorProfile(existing).catch(() => {});
      profileService.migratePlaceholderContacts().catch(() => {});
    }
  },

  createAccount: (displayName: string) => {
    const newIdentity = createNewIdentity(displayName);
    KeyVault.saveIdentity(newIdentity);
    set({ identity: newIdentity });
    messageReceiver.startListening();
    profileService.publishWarriorProfile(newIdentity).catch(() => {});
    return newIdentity;
  },

  setIdentity: (identity: UserIdentity) => {
    KeyVault.saveIdentity(identity);
    set({ identity });
    messageReceiver.startListening();
    profileService.publishWarriorProfile(identity).catch(() => {});
  },

  importAccount: (mnemonic: string, displayName: string) => {
    const restored = restoreIdentityFromMnemonic(mnemonic, displayName);
    KeyVault.saveIdentity(restored);
    set({ identity: restored });
    messageReceiver.startListening();
    profileService.publishWarriorProfile(restored).catch(() => {});
    return restored;
  },

  logout: () => {
    messageReceiver.stopListening();
    KeyVault.clearIdentity();
    set({ identity: null });
  },
}));
