import { SignalingPayload } from './types';

export type SignalingCallback = (payload: SignalingPayload) => void;

export class SignalingService {
  private ws: WebSocket | null = null;
  private roomCode: string = '';
  private topic: string = '';
  private myId: string = '';
  private onMessageCallback: SignalingCallback | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor(myId: string) {
    this.myId = myId;
  }

  public connect(roomCode: string, onMessage: SignalingCallback): void {
    this.disconnect();
    this.roomCode = roomCode.trim().toUpperCase();
    this.topic = `zchat-room-${this.roomCode.replace(/[^A-Z0-9]/g, '')}`;
    this.onMessageCallback = onMessage;

    this.initWebSocket();
  }

  private initWebSocket(): void {
    if (!this.topic) return;

    try {
      const url = `wss://ntfy.sh/${this.topic}/ws`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === 'message' && raw.message) {
            const payload: SignalingPayload = JSON.parse(raw.message);
            // Ignore messages sent by ourselves
            if (payload.senderId === this.myId) return;
            // Ignore messages not meant for us (if targeted)
            if (payload.targetId && payload.targetId !== this.myId) return;

            if (this.onMessageCallback) {
              this.onMessageCallback(payload);
            }
          }
        } catch {
          // ignore malformed signaling frames
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Signaling WebSocket error:', err);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect if room is still active
        if (this.roomCode) {
          this.reconnectTimer = setTimeout(() => {
            if (this.roomCode) this.initWebSocket();
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('Signaling init failed:', err);
    }
  }

  public async sendSignal(payload: Omit<SignalingPayload, 'senderId' | 'roomCode' | 'timestamp'>): Promise<boolean> {
    if (!this.topic) return false;

    const fullPayload: SignalingPayload = {
      ...payload,
      senderId: this.myId,
      roomCode: this.roomCode,
      timestamp: Date.now(),
    };

    try {
      const res = await fetch(`https://ntfy.sh/${this.topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to send signal:', err);
      return false;
    }
  }

  public isSignalingConnected(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.isConnected = false;
    this.roomCode = '';
    this.topic = '';
    this.onMessageCallback = null;
  }
}
