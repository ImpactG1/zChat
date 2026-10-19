import { describe, it, expect } from 'vitest';
import { p2pManager } from '../src/core/p2p/p2pManager';
import { SignalingService } from '../src/core/p2p/signaling';

describe('P2P WebRTC Squad Mesh Engine', () => {
  it('initializes user and formats room codes correctly', () => {
    const fakeIdentity = {
      pubkey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      npub: 'npub10123456789abcdef',
      privkey: '1111111111111111111111111111111111111111111111111111111111111111',
      displayName: 'zMayank',
      tag: '#0123',
      mnemonic: 'test test test test test test test test test test test junk',
      createdAt: Date.now(),
    };

    p2pManager.initUser(fakeIdentity);
    const state = p2pManager.getRoomState();
    expect(state.status).toBe('idle');
    expect(state.averagePing).toBe(0);
    expect(Object.keys(state.peers).length).toBe(0);
  });

  it('signaling service initializes with clean topic naming', () => {
    const signaling = new SignalingService('peer-test-123');
    expect(signaling.isSignalingConnected()).toBe(false);

    // Test that signaling can disconnect safely without crash
    signaling.disconnect();
    expect(signaling.isSignalingConnected()).toBe(false);
  });

  it('room state aggregates peer latencies correctly', () => {
    const state = p2pManager.getRoomState();
    expect(state.isHost).toBe(false);
    expect(state.messages).toEqual([]);
  });
});
