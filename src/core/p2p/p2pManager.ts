import { P2PPeer, P2PMessage, SignalingPayload, SquadRoomState } from './types';
import { SignalingService } from './signaling';
import { UserIdentity } from '@/types';
import { db } from '../storage/db';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface PeerConnectionEntry {
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
  peer: P2PPeer;
  pendingCandidates: RTCIceCandidateInit[];
}

export class P2PManager {
  private static instance: P2PManager;
  private myId: string = '';
  private myTag: string = '';
  private myPubkey: string = '';
  private signaling: SignalingService | null = null;
  private roomCode: string = '';
  private isHost: boolean = false;
  private peers: Map<string, PeerConnectionEntry> = new Map();
  private pingInterval: any = null;

  // Listeners
  private onStateChangeListeners: Array<(state: SquadRoomState) => void> = [];
  private onMessageListeners: Array<(message: P2PMessage) => void> = [];

  private constructor() {}

  public static getInstance(): P2PManager {
    if (!P2PManager.instance) {
      P2PManager.instance = new P2PManager();
    }
    return P2PManager.instance;
  }

  public initUser(identity: UserIdentity): void {
    this.myId = identity.pubkey.slice(0, 16);
    this.myTag = identity.displayName || 'Gamer';
    this.myPubkey = identity.pubkey;
    if (this.signaling) {
      this.signaling.disconnect();
    }
    this.signaling = new SignalingService(this.myId);
  }

  public async joinSquadRoom(roomCode: string, isHost: boolean = false): Promise<void> {
    this.leaveSquadRoom();

    this.roomCode = roomCode.trim().toUpperCase();
    this.isHost = isHost;

    if (!this.signaling) {
      this.myId = crypto.randomUUID().slice(0, 16);
      this.myTag = 'Gamer';
      this.signaling = new SignalingService(this.myId);
    }

    this.emitState();

    // 1. Connect to signaling channel
    this.signaling.connect(this.roomCode, (payload) => this.handleSignalingMessage(payload));

    // 2. Announce presence to room
    setTimeout(() => {
      this.signaling?.sendSignal({
        type: 'announce',
        gamerTag: this.myTag,
        pubkey: this.myPubkey,
      });
    }, 200);

    // 3. Start Ping Heartbeat (every 2.5 seconds)
    this.pingInterval = setInterval(() => {
      this.broadcastPing();
    }, 2500);
  }

  public leaveSquadRoom(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.signaling && this.roomCode) {
      this.signaling.sendSignal({ type: 'leave' });
      this.signaling.disconnect();
    }

    // Close all peer connections
    for (const [, entry] of this.peers) {
      try {
        entry.channel?.close();
        entry.pc.close();
      } catch {}
    }
    this.peers.clear();
    this.roomCode = '';
    this.isHost = false;

    this.emitState();
  }

  public getRoomState(): SquadRoomState {
    const peersObj: Record<string, P2PPeer> = {};
    let totalPing = 0;
    let pingCount = 0;

    for (const [id, entry] of this.peers) {
      peersObj[id] = entry.peer;
      if (entry.peer.pingMs > 0) {
        totalPing += entry.peer.pingMs;
        pingCount++;
      }
    }

    const avgPing = pingCount > 0 ? Math.round(totalPing / pingCount) : 0;

    return {
      code: this.roomCode,
      name: `Squad ${this.roomCode}`,
      isHost: this.isHost,
      status: this.roomCode ? (this.peers.size > 0 ? 'connected' : 'signaling') : 'idle',
      peers: peersObj,
      messages: [],
      averagePing: avgPing,
    };
  }

  public subscribeState(listener: (state: SquadRoomState) => void): () => void {
    this.onStateChangeListeners.push(listener);
    listener(this.getRoomState());
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  public subscribeMessages(listener: (message: P2PMessage) => void): () => void {
    this.onMessageListeners.push(listener);
    return () => {
      this.onMessageListeners = this.onMessageListeners.filter((l) => l !== listener);
    };
  }

  private emitState(): void {
    const state = this.getRoomState();
    for (const listener of this.onStateChangeListeners) {
      listener(state);
    }
  }

  /**
   * Broadcasts a message to all connected peers directly over WebRTC DataChannel
   */
  public async sendChatMessage(content: string): Promise<P2PMessage> {
    const message: P2PMessage = {
      id: crypto.randomUUID(),
      roomCode: this.roomCode,
      senderId: this.myId,
      senderTag: this.myTag,
      senderPubkey: this.myPubkey,
      content,
      timestamp: Date.now(),
      type: 'chat',
    };

    const payload = JSON.stringify(message);

    // Send directly over UDP DataChannel to each connected peer
    let sentCount = 0;
    for (const [, entry] of this.peers) {
      if (entry.channel && entry.channel.readyState === 'open') {
        try {
          entry.channel.send(payload);
          sentCount++;
        } catch (err) {
          console.warn('Failed to send data to peer:', entry.peer.gamerTag, err);
        }
      }
    }

    // Save locally to Dexie groups for persistence
    try {
      await db.groupMessages.put({
        id: message.id,
        groupId: `squad-${this.roomCode}`,
        senderPubkey: this.myPubkey,
        content: message.content,
        timestamp: message.timestamp,
        authorAlias: this.myTag,
      });
    } catch {}

    // Emit locally to UI listeners
    for (const listener of this.onMessageListeners) {
      listener(message);
    }

    return message;
  }

  private broadcastPing(): void {
    const now = Date.now();
    for (const [, entry] of this.peers) {
      if (entry.channel && entry.channel.readyState === 'open') {
        try {
          entry.channel.send(JSON.stringify({ type: 'ping', sendTs: now }));
        } catch {}
      }
    }
  }

  private async handleSignalingMessage(payload: SignalingPayload): Promise<void> {
    const remoteId = payload.senderId;

    switch (payload.type) {
      case 'announce': {
        const remoteTag = payload.gamerTag || `Gamer#${remoteId.slice(0, 4)}`;
        const remotePubkey = payload.pubkey || remoteId;

        // Auto-register contact in Dexie so they appear in contact list
        this.saveContact(remotePubkey, remoteTag);

        // Lexicographically smaller ID initiates the WebRTC offer to prevent glare
        if (this.myId < remoteId) {
          await this.createPeerAndOffer(remoteId, remoteTag, remotePubkey);
        } else {
          // Send announcement back so the other peer knows we exist
          this.signaling?.sendSignal({
            type: 'announce',
            targetId: remoteId,
            gamerTag: this.myTag,
            pubkey: this.myPubkey,
          });
        }
        break;
      }

      case 'offer': {
        if (!payload.sdp) return;
        const remoteTag = payload.gamerTag || `Gamer#${remoteId.slice(0, 4)}`;
        const remotePubkey = payload.pubkey || remoteId;
        await this.handleOffer(remoteId, remoteTag, remotePubkey, payload.sdp);
        break;
      }

      case 'answer': {
        if (!payload.sdp) return;
        await this.handleAnswer(remoteId, payload.sdp);
        break;
      }

      case 'candidate': {
        if (!payload.candidate) return;
        await this.handleCandidate(remoteId, payload.candidate);
        break;
      }

      case 'leave': {
        this.removePeer(remoteId);
        break;
      }
    }
  }

  private async createPeerAndOffer(remoteId: string, remoteTag: string, remotePubkey: string): Promise<void> {
    if (this.peers.has(remoteId)) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const peer: P2PPeer = {
      peerId: remoteId,
      gamerTag: remoteTag,
      pubkey: remotePubkey,
      pingMs: 0,
      connectionState: 'connecting',
    };

    const entry: PeerConnectionEntry = {
      pc,
      peer,
      pendingCandidates: [],
    };
    this.peers.set(remoteId, entry);

    // Create low-latency ordered DataChannel
    const channel = pc.createDataChannel('zchat-udp-stream', { ordered: true });
    entry.channel = channel;
    this.setupDataChannel(remoteId, channel);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling?.sendSignal({
          type: 'candidate',
          targetId: remoteId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      entry.peer.connectionState = pc.connectionState as any;
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(remoteId);
      }
      this.emitState();
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await this.signaling?.sendSignal({
        type: 'offer',
        targetId: remoteId,
        sdp: offer,
        gamerTag: this.myTag,
        pubkey: this.myPubkey,
      });
    } catch (err) {
      console.warn('Failed to create WebRTC offer:', err);
    }

    this.emitState();
  }

  private async handleOffer(remoteId: string, remoteTag: string, remotePubkey: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    let entry = this.peers.get(remoteId);
    if (!entry) {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const peer: P2PPeer = {
        peerId: remoteId,
        gamerTag: remoteTag,
        pubkey: remotePubkey,
        pingMs: 0,
        connectionState: 'connecting',
      };
      entry = { pc, peer, pendingCandidates: [] };
      this.peers.set(remoteId, entry);

      pc.ondatachannel = (event) => {
        entry!.channel = event.channel;
        this.setupDataChannel(remoteId, event.channel);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.signaling?.sendSignal({
            type: 'candidate',
            targetId: remoteId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        entry!.peer.connectionState = pc.connectionState as any;
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          this.removePeer(remoteId);
        }
        this.emitState();
      };
    }

    try {
      await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Process any early buffered candidates
      for (const cand of entry.pendingCandidates) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      }
      entry.pendingCandidates = [];

      const answer = await entry.pc.createAnswer();
      await entry.pc.setLocalDescription(answer);

      await this.signaling?.sendSignal({
        type: 'answer',
        targetId: remoteId,
        sdp: answer,
        gamerTag: this.myTag,
        pubkey: this.myPubkey,
      });
    } catch (err) {
      console.warn('Failed to handle WebRTC offer:', err);
    }

    this.emitState();
  }

  private async handleAnswer(remoteId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const entry = this.peers.get(remoteId);
    if (!entry) return;

    try {
      await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Process any buffered candidates
      for (const cand of entry.pendingCandidates) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      }
      entry.pendingCandidates = [];
    } catch (err) {
      console.warn('Failed to handle WebRTC answer:', err);
    }

    this.emitState();
  }

  private async handleCandidate(remoteId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const entry = this.peers.get(remoteId);
    if (!entry) return;

    if (entry.pc.remoteDescription) {
      try {
        await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Failed to add ICE candidate:', err);
      }
    } else {
      entry.pendingCandidates.push(candidate);
    }
  }

  private setupDataChannel(remoteId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      const entry = this.peers.get(remoteId);
      if (entry) {
        entry.peer.connectionState = 'connected';
        // Send initial instant ping
        try {
          channel.send(JSON.stringify({ type: 'ping', sendTs: Date.now() }));
        } catch {}
      }
      this.emitState();
    };

    channel.onmessage = async (event) => {
      try {
        const raw = JSON.parse(event.data);

        // Instant UDP Ping / Pong Round-Trip Latency
        if (raw.type === 'ping') {
          channel.send(JSON.stringify({ type: 'pong', sendTs: raw.sendTs }));
          return;
        }

        if (raw.type === 'pong') {
          const entry = this.peers.get(remoteId);
          if (entry && raw.sendTs) {
            const rtt = Math.max(1, Math.round(Date.now() - raw.sendTs));
            entry.peer.pingMs = rtt;
            entry.peer.lastPingTimestamp = Date.now();
            this.emitState();
          }
          return;
        }

        // Live Chat Message
        if (raw.type === 'chat' && raw.content) {
          const message: P2PMessage = raw;

          // Save to local Dexie groups store
          try {
            await db.groupMessages.put({
              id: message.id,
              groupId: `squad-${this.roomCode}`,
              senderPubkey: message.senderPubkey,
              content: message.content,
              timestamp: message.timestamp,
              authorAlias: message.senderTag,
            });
          } catch {}

          // Notify UI listeners
          for (const listener of this.onMessageListeners) {
            listener(message);
          }
        }
      } catch (err) {
        console.warn('Failed to parse incoming peer message:', err);
      }
    };

    channel.onclose = () => {
      this.removePeer(remoteId);
    };

    channel.onerror = () => {
      this.removePeer(remoteId);
    };
  }

  private removePeer(remoteId: string): void {
    const entry = this.peers.get(remoteId);
    if (entry) {
      try {
        entry.channel?.close();
        entry.pc.close();
      } catch {}
      this.peers.delete(remoteId);
      this.emitState();
    }
  }

  private async saveContact(pubkey: string, alias: string): Promise<void> {
    try {
      const existing = await db.contacts.get(pubkey);
      if (!existing) {
        await db.contacts.put({
          pubkey,
          npub: '',
          alias,
          tag: `#${pubkey.slice(0, 4)}`,
          unreadCount: 0,
          isBlocked: false,
          lastTimestamp: Date.now(),
        });
      }
    } catch {}
  }
}

export const p2pManager = P2PManager.getInstance();
