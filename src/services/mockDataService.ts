/**
 * ZENYTH // DUELING GROUNDS
 * Mock Data Service & Presentation Contract Layer
 * Decouples the UI completely from live WebSockets/relays while mirroring
 * the exact TypeScript schemas for seamless backend plug-in later.
 */

import { UserIdentity, Contact, ChatMessage, GroupChat, GroupMessage, RelayConfig } from '@/types';

// =========================================================================
// IN-WORLD MOCK IDENTITIES & DATA
// =========================================================================

export const MOCK_USER: UserIdentity = {
  pubkey: '7e2a91b48f6c3109d0e821ba44c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c8',
  npub: 'npub1zenythvanguard7e2a91b48f6c3109d0e821ba44c9b201f8e4a5c6d7e8f9a0',
  privkey: '44a8c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b48f6c3109d0e821',
  displayName: 'Vanguard',
  tag: '#7e2a',
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
  mnemonic: 'obsidian chrome blade ritual sanctum vanguard cipher monolith seal vertex silent apex',
};

export const MOCK_CONTACTS: Contact[] = [
  {
    pubkey: '8f3a1109d0e821ba44c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b4',
    npub: 'npub1viper8f3a1109d0e821ba44c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7',
    alias: 'Viper',
    tag: '#8f3a',
    unreadCount: 2,
    lastMessage: 'The epoch key rotated. Meet at the eastern perimeter.',
    lastTimestamp: Date.now() - 1000 * 60 * 4, // 4 mins ago
    isBlocked: false,
  },
  {
    pubkey: 'a9c144c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b48f3a1109d0e8',
    npub: 'npub1ghosta9c144c9b201f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b48f',
    alias: 'Ghost',
    tag: '#a9c1',
    unreadCount: 0,
    lastMessage: 'Whisper sealed. No relay interception detected.',
    lastTimestamp: Date.now() - 1000 * 60 * 42, // 42 mins ago
    isBlocked: false,
  },
  {
    pubkey: '44d2d3e4f5a6b7c87e2a91b48f3a1109d0e821ba44c9b201f8e4a5c6d7e8f9a0',
    npub: 'npub1raven44d2d3e4f5a6b7c87e2a91b48f3a1109d0e821ba44c9b201f8e4a5',
    alias: 'Raven',
    tag: '#44d2',
    unreadCount: 0,
    lastMessage: 'Voice dispatch transmitted. 24s duration.',
    lastTimestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    isBlocked: false,
  },
  {
    pubkey: '22e8f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b48f3a1109d0e821ba44c9',
    npub: 'npub1cipher22e8f8e4a5c6d7e8f9a0b1c2d3e4f5a6b7c87e2a91b48f3a1109d0',
    alias: 'Cipher',
    tag: '#22e8',
    unreadCount: 0,
    lastMessage: 'Fingerprint verified against the sanctum ledger.',
    lastTimestamp: Date.now() - 1000 * 60 * 60 * 26, // 1 day ago
    isBlocked: false,
  },
];

export const MOCK_GROUPS: GroupChat[] = [
  {
    id: 'group_sanctum_001',
    name: 'DUELING GROUNDS #001',
    adminPubkey: MOCK_USER.pubkey,
    currentEpoch: 3,
    groupKeyHex: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    members: [
      MOCK_USER.pubkey,
      MOCK_CONTACTS[0].pubkey,
      MOCK_CONTACTS[1].pubkey,
      MOCK_CONTACTS[2].pubkey,
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    lastMessage: 'Vanguard: Defensive perimeter holding at Node IV.',
    lastTimestamp: Date.now() - 1000 * 60 * 12,
    unreadCount: 1,
  },
  {
    id: 'group_raid_party',
    name: 'RAID PARTY: SHADOW SANCTUM',
    adminPubkey: MOCK_CONTACTS[0].pubkey,
    currentEpoch: 1,
    groupKeyHex: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    members: [
      MOCK_USER.pubkey,
      MOCK_CONTACTS[0].pubkey,
      MOCK_CONTACTS[3].pubkey,
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    lastMessage: 'Viper: Raid commences at 22:00 UTC. Prepare keys.',
    lastTimestamp: Date.now() - 1000 * 60 * 95,
    unreadCount: 0,
  },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  // Direct chat with Viper#8f3a
  [MOCK_CONTACTS[0].pubkey]: [
    {
      id: 'msg_001',
      conversationId: MOCK_CONTACTS[0].pubkey,
      senderPubkey: MOCK_CONTACTS[0].pubkey,
      recipientPubkey: MOCK_USER.pubkey,
      content: 'Have you verified the signature of the incoming relay batch?',
      timestamp: Date.now() - 1000 * 60 * 15,
      status: 'delivered',
      retryCount: 0,
    },
    {
      id: 'msg_002',
      conversationId: MOCK_CONTACTS[0].pubkey,
      senderPubkey: MOCK_USER.pubkey,
      recipientPubkey: MOCK_CONTACTS[0].pubkey,
      content: 'Confirmed. Encrypted with Ephemeral Secp256k1 keypair. Zero leakage.',
      timestamp: Date.now() - 1000 * 60 * 10,
      status: 'delivered',
      retryCount: 0,
    },
    {
      id: 'msg_003',
      conversationId: MOCK_CONTACTS[0].pubkey,
      senderPubkey: MOCK_CONTACTS[0].pubkey,
      recipientPubkey: MOCK_USER.pubkey,
      content: 'The epoch key rotated. Meet at the eastern perimeter.',
      timestamp: Date.now() - 1000 * 60 * 4,
      status: 'delivered',
      retryCount: 0,
    },
  ],

  // Direct chat with Ghost#a9c1
  [MOCK_CONTACTS[1].pubkey]: [
    {
      id: 'msg_010',
      conversationId: MOCK_CONTACTS[1].pubkey,
      senderPubkey: MOCK_CONTACTS[1].pubkey,
      recipientPubkey: MOCK_USER.pubkey,
      content: 'Whisper sealed. No relay interception detected.',
      timestamp: Date.now() - 1000 * 60 * 42,
      status: 'delivered',
      retryCount: 0,
    },
  ],
};

export const MOCK_GROUP_MESSAGES: Record<string, GroupMessage[]> = {
  [MOCK_GROUPS[0].id]: [
    {
      id: 'gmsg_001',
      groupId: MOCK_GROUPS[0].id,
      senderPubkey: MOCK_CONTACTS[1].pubkey,
      senderTag: '#a9c1',
      content: 'Sanctum gates sealed. All 4 nodes operational.',
      timestamp: Date.now() - 1000 * 60 * 60,
      epoch: 3,
      status: 'delivered',
    },
    {
      id: 'gmsg_002',
      groupId: MOCK_GROUPS[0].id,
      senderPubkey: MOCK_CONTACTS[0].pubkey,
      senderTag: '#8f3a',
      content: 'Enemy reconnaissance pinged Relay 02. No payload compromised.',
      timestamp: Date.now() - 1000 * 60 * 25,
      epoch: 3,
      status: 'delivered',
    },
    {
      id: 'gmsg_003',
      groupId: MOCK_GROUPS[0].id,
      senderPubkey: MOCK_USER.pubkey,
      senderTag: '#7e2a',
      content: 'Defensive perimeter holding at Node IV. Keep channels silent.',
      timestamp: Date.now() - 1000 * 60 * 12,
      epoch: 3,
      status: 'delivered',
    },
  ],
};

export const MOCK_RELAYS: RelayConfig[] = [
  {
    url: 'wss://relay.zenyth.network',
    isEnabled: true,
    latencyMs: 18,
    status: 'connected',
    lastSeen: Date.now() - 1000 * 5,
  },
  {
    url: 'wss://monolith.damus.io',
    isEnabled: true,
    latencyMs: 42,
    status: 'connected',
    lastSeen: Date.now() - 1000 * 12,
  },
  {
    url: 'wss://nos.lol',
    isEnabled: true,
    latencyMs: 64,
    status: 'connected',
    lastSeen: Date.now() - 1000 * 30,
  },
  {
    url: 'wss://relay.primal.net',
    isEnabled: false,
    latencyMs: 110,
    status: 'disconnected',
    lastSeen: Date.now() - 1000 * 60 * 120,
  },
];

// =========================================================================
// MOCK SERVICE CLIENT (EventEmitter Pattern for reactive UI)
// =========================================================================

class MockDataService {
  private user: UserIdentity = { ...MOCK_USER };
  private contacts: Contact[] = [...MOCK_CONTACTS];
  private groups: GroupChat[] = [...MOCK_GROUPS];
  private directMessages: Record<string, ChatMessage[]> = { ...MOCK_MESSAGES };
  private groupMessages: Record<string, GroupMessage[]> = { ...MOCK_GROUP_MESSAGES };
  private relays: RelayConfig[] = [...MOCK_RELAYS];

  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // Identity methods
  public getUser(): UserIdentity {
    return this.user;
  }

  public updateUserDisplayName(name: string): void {
    this.user.displayName = name;
    this.notify();
  }

  // Contact & Chat List methods
  public getContacts(): Contact[] {
    return this.contacts;
  }

  public getGroups(): GroupChat[] {
    return this.groups;
  }

  public getDirectMessages(pubkey: string): ChatMessage[] {
    return this.directMessages[pubkey] || [];
  }

  public getGroupMessages(groupId: string): GroupMessage[] {
    return this.groupMessages[groupId] || [];
  }

  // Message Sending Simulation
  public sendDirectMessage(recipientPubkey: string, content: string): ChatMessage {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conversationId: recipientPubkey,
      senderPubkey: this.user.pubkey,
      recipientPubkey,
      content,
      timestamp: Date.now(),
      status: 'delivered',
      retryCount: 0,
    };

    if (!this.directMessages[recipientPubkey]) {
      this.directMessages[recipientPubkey] = [];
    }
    this.directMessages[recipientPubkey].push(newMsg);

    // Update contact last message
    const contact = this.contacts.find((c) => c.pubkey === recipientPubkey);
    if (contact) {
      contact.lastMessage = content;
      contact.lastTimestamp = newMsg.timestamp;
    }

    this.notify();
    return newMsg;
  }

  public sendGroupMessage(groupId: string, content: string): GroupMessage {
    const group = this.groups.find((g) => g.id === groupId);
    const newMsg: GroupMessage = {
      id: `gmsg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      groupId,
      senderPubkey: this.user.pubkey,
      senderTag: this.user.tag,
      content,
      timestamp: Date.now(),
      epoch: group ? group.currentEpoch : 1,
      status: 'delivered',
    };

    if (!this.groupMessages[groupId]) {
      this.groupMessages[groupId] = [];
    }
    this.groupMessages[groupId].push(newMsg);

    if (group) {
      group.lastMessage = `${this.user.displayName}: ${content}`;
      group.lastTimestamp = newMsg.timestamp;
    }

    this.notify();
    return newMsg;
  }

  // Relay methods
  public getRelays(): RelayConfig[] {
    return this.relays;
  }

  public toggleRelay(url: string): void {
    const r = this.relays.find((relay) => relay.url === url);
    if (r) {
      r.isEnabled = !r.isEnabled;
      r.status = r.isEnabled ? 'connected' : 'disconnected';
      this.notify();
    }
  }

  // Group creation
  public createGroup(name: string, memberPubkeys: string[]): GroupChat {
    const newGroup: GroupChat = {
      id: `group_${Date.now()}`,
      name,
      adminPubkey: this.user.pubkey,
      currentEpoch: 1,
      groupKeyHex: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      members: [this.user.pubkey, ...memberPubkeys],
      createdAt: Date.now(),
      lastMessage: 'Sanctum forged. Ready for transmission.',
      lastTimestamp: Date.now(),
      unreadCount: 0,
    };
    this.groups.unshift(newGroup);
    this.notify();
    return newGroup;
  }
}

export const MockService = new MockDataService();
