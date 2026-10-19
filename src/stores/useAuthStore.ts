import { create } from 'zustand';
import { UserIdentity } from '@/types';
import { KeyVault } from '@/core/storage/keyVault';
import { createNewIdentity, restoreIdentityFromMnemonic } from '@/core/crypto/keys';
import { messageReceiver } from '@/core/nostr/messageReceiver';

interface AuthState {
  identity: UserIdentity | null;
  isInitialized: boolean;
  init: () => void;
  createAccount: (displayName: string) => UserIdentity;
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
    }
  },

  createAccount: (displayName: string) => {
    const newIdentity = createNewIdentity(displayName);
    KeyVault.saveIdentity(newIdentity);
    set({ identity: newIdentity });
    messageReceiver.startListening();
    return newIdentity;
  },

  importAccount: (mnemonic: string, displayName: string) => {
    const restored = restoreIdentityFromMnemonic(mnemonic, displayName);
    KeyVault.saveIdentity(restored);
    set({ identity: restored });
    messageReceiver.startListening();
    return restored;
  },

  logout: () => {
    messageReceiver.stopListening();
    KeyVault.clearIdentity();
    set({ identity: null });
  },
}));
