export interface P2PPeer {
  peerId: string;
  gamerTag: string;
  pubkey: string;
  pingMs: number;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  lastPingTimestamp?: number;
}

export interface P2PMessage {
  id: string;
  roomCode: string;
  senderId: string;
  senderTag: string;
  senderPubkey: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'ping' | 'pong' | 'announcement';
}

export interface SignalingPayload {
  type: 'announce' | 'offer' | 'answer' | 'candidate' | 'leave';
  senderId: string;
  targetId?: string;
  roomCode: string;
  gamerTag?: string;
  pubkey?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  timestamp: number;
}

export interface SquadRoomState {
  code: string;
  name: string;
  isHost: boolean;
  status: 'idle' | 'signaling' | 'connected' | 'disconnected';
  peers: Record<string, P2PPeer>;
  messages: P2PMessage[];
  averagePing: number;
}
