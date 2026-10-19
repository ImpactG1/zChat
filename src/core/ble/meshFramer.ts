/**
 * Bluetooth Low Energy (BLE) Mesh Packet Framer
 * Optimized for constrained BLE MTU sizes (typically 20-512 bytes)
 * Bitchat / decentralized mesh compatible architecture
 */

export interface BLEPacketHeader {
  magic: number;         // 0x5A ('Z')
  type: number;          // 0x01 = Message, 0x02 = Beacon/Discovery, 0x03 = GroupBroadcast
  messageId: number;     // 16-bit identifier
  chunkIndex: number;    // 0 to totalChunks - 1
  totalChunks: number;   // Total fragments in message
}

export interface ReassembledBLEMessage {
  messageId: number;
  type: number;
  payload: string;
}

export class BLEMeshFramer {
  public static readonly MAGIC = 0x5a;
  public static readonly HEADER_SIZE = 6;
  public static readonly DEFAULT_CHUNK_SIZE = 180; // Safe for BLE MTU 200+

  private static messageBuffers: Map<number, { chunks: (Uint8Array | null)[]; total: number; type: number; lastUpdated: number }> = new Map();

  /**
   * Splits an encrypted text or JSON payload into binary BLE chunks
   */
  public static frameMessage(
    payload: string,
    type: number = 0x01,
    chunkPayloadSize: number = BLEMeshFramer.DEFAULT_CHUNK_SIZE
  ): Uint8Array[] {
    const rawBytes = new TextEncoder().encode(payload);
    const totalChunks = Math.ceil(rawBytes.length / chunkPayloadSize);
    const messageId = Math.floor(Math.random() * 65535);

    const packets: Uint8Array[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkPayloadSize;
      const end = Math.min(start + chunkPayloadSize, rawBytes.length);
      const slice = rawBytes.slice(start, end);

      const packet = new Uint8Array(BLEMeshFramer.HEADER_SIZE + slice.length);
      // Header
      packet[0] = BLEMeshFramer.MAGIC;
      packet[1] = type & 0xff;
      packet[2] = (messageId >> 8) & 0xff;
      packet[3] = messageId & 0xff;
      packet[4] = i & 0xff;
      packet[5] = totalChunks & 0xff;
      // Payload
      packet.set(slice, BLEMeshFramer.HEADER_SIZE);

      packets.push(packet);
    }

    return packets;
  }

  /**
   * Ingests an incoming BLE packet fragment and returns reassembled message when complete
   */
  public static ingestPacket(packet: Uint8Array): ReassembledBLEMessage | null {
    if (packet.length < BLEMeshFramer.HEADER_SIZE || packet[0] !== BLEMeshFramer.MAGIC) {
      return null;
    }

    const type = packet[1];
    const messageId = (packet[2] << 8) | packet[3];
    const chunkIndex = packet[4];
    const totalChunks = packet[5];
    const payloadChunk = packet.slice(BLEMeshFramer.HEADER_SIZE);

    let buffer = this.messageBuffers.get(messageId);
    if (!buffer) {
      buffer = {
        chunks: new Array(totalChunks).fill(null),
        total: totalChunks,
        type,
        lastUpdated: Date.now(),
      };
      this.messageBuffers.set(messageId, buffer);
    }

    buffer.chunks[chunkIndex] = payloadChunk;
    buffer.lastUpdated = Date.now();

    // Check if all chunks received
    const isComplete = buffer.chunks.every((c) => c !== null);
    if (!isComplete) {
      return null;
    }

    // Reassemble full message
    let totalLength = 0;
    for (const chunk of buffer.chunks) {
      totalLength += chunk!.length;
    }

    const fullBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of buffer.chunks) {
      fullBytes.set(chunk!, offset);
      offset += chunk!.length;
    }

    this.messageBuffers.delete(messageId);

    try {
      const decoded = new TextDecoder().decode(fullBytes);
      return {
        messageId,
        type,
        payload: decoded,
      };
    } catch {
      return null;
    }
  }

  /**
   * Clean up expired incomplete buffers older than 60s
   */
  public static cleanupStaleBuffers(maxAgeMs: number = 60000): void {
    const now = Date.now();
    for (const [id, buf] of this.messageBuffers.entries()) {
      if (now - buf.lastUpdated > maxAgeMs) {
        this.messageBuffers.delete(id);
      }
    }
  }
}
