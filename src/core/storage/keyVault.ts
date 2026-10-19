import { UserIdentity } from '@/types';

const STORAGE_KEY = 'zchat_identity_vault';

export const KeyVault = {
  saveIdentity(identity: UserIdentity): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  },

  getIdentity(): UserIdentity | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserIdentity;
    } catch {
      return null;
    }
  },

  clearIdentity(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  hasIdentity(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },
};
