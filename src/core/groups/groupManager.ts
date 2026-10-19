import { generateGroupKey, encryptGroupMessage, decryptGroupMessage } from './groupCrypto';
import { db } from '../storage/db';
import { KeyVault } from '../storage/keyVault';
import { sendDirectMessage } from '../nostr/messageSender';
import { nostrClient } from '../nostr/client';
import { GroupChat, GroupMessage } from '@/types';
import { finalizeEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

export class GroupManager {
  /**
   * Creates a new Gaming Party Group and sends E2EE invites with the group key
   */
  public static async createGroup(name: string, memberPubkeys: string[]): Promise<GroupChat> {
    const identity = KeyVault.getIdentity();
    if (!identity) throw new Error('No identity found');

    const groupId = crypto.randomUUID();
    const groupKeyHex = generateGroupKey();
    const allMembers = Array.from(new Set([identity.pubkey, ...memberPubkeys]));

    const group: GroupChat = {
      id: groupId,
      name,
      adminPubkey: identity.pubkey,
      currentEpoch: 1,
      groupKeyHex,
      members: allMembers,
      createdAt: Date.now(),
      unreadCount: 0,
      lastTimestamp: Date.now(),
    };

    await db.groups.put(group);

    // Send encrypted group key invite to each member over NIP-17 DMs
    const invitePayload = JSON.stringify({
      type: 'GROUP_INVITE',
      groupId,
      name,
      groupKeyHex,
      epoch: 1,
      adminPubkey: identity.pubkey,
      members: allMembers,
    });

    for (const member of memberPubkeys) {
      if (member !== identity.pubkey) {
        sendDirectMessage(member, invitePayload).catch((e) =>
          console.warn('Failed to send group invite to member:', member, e)
        );
      }
    }

    return group;
  }

  /**
   * Sends an encrypted group message broadcasted to public Nostr relays
   */
  public static async sendGroupMessage(groupId: string, content: string): Promise<GroupMessage> {
    const identity = KeyVault.getIdentity();
    if (!identity) throw new Error('No identity found');

    const group = await db.groups.get(groupId);
    if (!group) throw new Error('Group not found');

    const messageId = crypto.randomUUID();
    const now = Date.now();

    const encryptedContent = encryptGroupMessage(content, group.groupKeyHex);

    const groupMessage: GroupMessage = {
      id: messageId,
      groupId,
      senderPubkey: identity.pubkey,
      senderTag: identity.tag,
      content,
      timestamp: now,
      epoch: group.currentEpoch,
      status: 'pending',
    };

    await db.groupMessages.put(groupMessage);
    await db.groups.update(groupId, {
      lastMessage: content,
      lastTimestamp: now,
    });

    // Nostr Kind 42 (Channel Message) or Kind 9002 (Encrypted Group Message)
    const eventTemplate = {
      kind: 9002,
      content: encryptedContent,
      tags: [
        ['h', groupId],
        ['epoch', group.currentEpoch.toString()],
      ],
      created_at: Math.floor(now / 1000),
    };

    try {
      const signedEvent = finalizeEvent(eventTemplate, hexToBytes(identity.privkey));
      const success = await nostrClient.publishEvent(signedEvent);
      if (success) {
        await db.groupMessages.update(messageId, { status: 'sent' });
        groupMessage.status = 'sent';
      }
    } catch (err) {
      console.error('Failed to broadcast group message:', err);
    }

    return groupMessage;
  }

  /**
   * Processes inbound group messages received from relay subscription
   */
  public static async processIncomingGroupEvent(event: any): Promise<void> {
    const hTag = event.tags.find((t: string[]) => t[0] === 'h');
    if (!hTag) return;
    const groupId = hTag[1];

    const group = await db.groups.get(groupId);
    if (!group) return; // Not a member of this group

    // Deduplicate
    const existing = await db.groupMessages.get(event.id);
    if (existing) return;

    try {
      const decrypted = decryptGroupMessage(event.content, group.groupKeyHex);

      const message: GroupMessage = {
        id: event.id,
        groupId,
        senderPubkey: event.pubkey,
        senderTag: `#${event.pubkey.slice(0, 4)}`,
        content: decrypted,
        timestamp: event.created_at * 1000,
        epoch: group.currentEpoch,
        status: 'delivered',
      };

      await db.groupMessages.put(message);
      await db.groups.update(groupId, {
        lastMessage: decrypted,
        lastTimestamp: message.timestamp,
        unreadCount: group.unreadCount + 1,
      });
    } catch (err) {
      console.warn('Failed to decrypt group message:', err);
    }
  }

  /**
   * Leader rotates the group key (Forward Secrecy when a member is removed)
   */
  public static async rotateGroupKey(groupId: string): Promise<void> {
    const identity = KeyVault.getIdentity();
    if (!identity) throw new Error('No identity');

    const group = await db.groups.get(groupId);
    if (!group || group.adminPubkey !== identity.pubkey) {
      throw new Error('Only the party leader can rotate the group key');
    }

    const newKey = generateGroupKey();
    const nextEpoch = group.currentEpoch + 1;

    await db.groups.update(groupId, {
      groupKeyHex: newKey,
      currentEpoch: nextEpoch,
    });

    const updatePayload = JSON.stringify({
      type: 'GROUP_KEY_ROTATION',
      groupId,
      newKeyHex: newKey,
      epoch: nextEpoch,
    });

    for (const member of group.members) {
      if (member !== identity.pubkey) {
        sendDirectMessage(member, updatePayload).catch((e) =>
          console.warn('Failed to send epoch key to member:', member, e)
        );
      }
    }
  }
}
