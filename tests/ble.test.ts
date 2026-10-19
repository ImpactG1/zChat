import { describe, it, expect } from 'vitest';
import { BLEMeshFramer } from '../src/core/ble/meshFramer';

describe('BLE Mesh Packet Framer', () => {
  it('correctly frames a large payload and reassembles it intact', () => {
    const longMessage = 'TACTICAL SQUAD UPDATE: Enemy drone spotted at grid 4. Move to extract point immediately. Repeat: Extract now!'.repeat(5);

    // Frame into small BLE packets (e.g. 50 bytes per chunk)
    const packets = BLEMeshFramer.frameMessage(longMessage, 0x01, 50);
    expect(packets.length).toBeGreaterThan(1);

    // Simulate sending packets out of order or sequentially
    let result = null;
    for (let i = 0; i < packets.length; i++) {
      result = BLEMeshFramer.ingestPacket(packets[i]);
      if (i < packets.length - 1) {
        expect(result).toBeNull(); // Not finished yet
      }
    }

    expect(result).not.toBeNull();
    expect(result?.payload).toBe(longMessage);
    expect(result?.type).toBe(0x01);
  });
});
