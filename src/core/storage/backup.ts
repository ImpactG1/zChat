import { db } from './db';
import { KeyVault } from './keyVault';

export interface FullBackupData {
  version: number;
  exportedAt: number;
  identity: any;
  contacts: any[];
  groups: any[];
  relays: any[];
}

export async function exportFullBackup(): Promise<string> {
  const identity = KeyVault.getIdentity();
  const contacts = await db.contacts.toArray();
  const groups = await db.groups.toArray();
  const relays = await db.relays.toArray();

  const data: FullBackupData = {
    version: 1,
    exportedAt: Date.now(),
    identity,
    contacts,
    groups,
    relays,
  };

  return JSON.stringify(data, null, 2);
}

export async function importFullBackup(jsonString: string): Promise<boolean> {
  try {
    const data: FullBackupData = JSON.parse(jsonString);
    if (!data.identity || !data.version) {
      throw new Error('Invalid backup schema');
    }

    if (data.identity) {
      KeyVault.saveIdentity(data.identity);
    }
    if (data.contacts && data.contacts.length > 0) {
      await db.contacts.bulkPut(data.contacts);
    }
    if (data.groups && data.groups.length > 0) {
      await db.groups.bulkPut(data.groups);
    }
    if (data.relays && data.relays.length > 0) {
      await db.relays.bulkPut(data.relays);
    }
    return true;
  } catch (err) {
    console.error('Failed to restore backup:', err);
    return false;
  }
}
