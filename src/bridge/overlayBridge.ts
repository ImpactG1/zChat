import { Capacitor, registerPlugin } from '@capacitor/core';
import { OverlayConfig } from '@/types';

export interface ZChatOverlayPlugin {
  showOverlay(options?: { opacity?: number; isClickThrough?: boolean }): Promise<{ success: boolean }>;
  hideOverlay(): Promise<{ success: boolean }>;
  setOpacity(options: { opacity: number }): Promise<{ success: boolean }>;
  setClickThrough(options: { enabled: boolean }): Promise<{ success: boolean }>;
  updateUnreadCount(options: { count: number }): Promise<{ success: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ requested: boolean }>;
}

const NativeOverlay = registerPlugin<ZChatOverlayPlugin>('ZChatOverlay');

export class OverlayBridge {
  private static isNative = Capacitor.isNativePlatform();

  /**
   * Checks if SYSTEM_ALERT_WINDOW permission is granted
   */
  public static async hasPermission(): Promise<boolean> {
    if (!this.isNative) return true; // Web fallback
    try {
      const res = await NativeOverlay.checkOverlayPermission();
      return res.granted;
    } catch (err) {
      console.warn('Native checkOverlayPermission failed:', err);
      return false;
    }
  }

  /**
   * Opens Android Settings page for "Display over other apps"
   */
  public static async requestPermission(): Promise<void> {
    if (!this.isNative) return;
    try {
      await NativeOverlay.requestOverlayPermission();
    } catch (err) {
      console.warn('Native requestOverlayPermission failed:', err);
    }
  }

  /**
   * Launches the persistent floating Chat Head bubble
   */
  public static async show(config?: Partial<OverlayConfig>): Promise<boolean> {
    if (!this.isNative) {
      console.log('[Web HUD Simulator] Overlay shown with config:', config);
      return true;
    }
    try {
      const res = await NativeOverlay.showOverlay({
        opacity: config?.opacity ?? 85,
        isClickThrough: config?.isClickThrough ?? false,
      });
      return res.success;
    } catch (err) {
      console.error('Failed to show native overlay:', err);
      return false;
    }
  }

  /**
   * Hides the floating bubble
   */
  public static async hide(): Promise<boolean> {
    if (!this.isNative) {
      console.log('[Web HUD Simulator] Overlay hidden');
      return true;
    }
    try {
      const res = await NativeOverlay.hideOverlay();
      return res.success;
    } catch (err) {
      console.error('Failed to hide native overlay:', err);
      return false;
    }
  }

  /**
   * Updates floating bubble opacity (Ghost Mode: 10% to 100%)
   */
  public static async setOpacity(opacity: number): Promise<void> {
    const clamped = Math.max(10, Math.min(100, opacity));
    document.documentElement.style.setProperty('--hud-opacity', `${clamped / 100}`);

    if (this.isNative) {
      try {
        await NativeOverlay.setOpacity({ opacity: clamped });
      } catch (err) {
        console.warn('Failed to update native overlay opacity:', err);
      }
    }
  }

  /**
   * Toggles Click-Through Mode (FLAG_NOT_TOUCHABLE)
   */
  public static async setClickThrough(enabled: boolean): Promise<void> {
    if (this.isNative) {
      try {
        await NativeOverlay.setClickThrough({ enabled });
      } catch (err) {
        console.warn('Failed to update click-through mode:', err);
      }
    }
  }

  /**
   * Updates unread badge on floating chat head
   */
  public static async updateBadge(count: number): Promise<void> {
    if (this.isNative) {
      try {
        await NativeOverlay.updateUnreadCount({ count });
      } catch (err) {
        console.warn('Failed to update native overlay unread count:', err);
      }
    }
  }
}
