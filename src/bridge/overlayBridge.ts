import { Capacitor, registerPlugin, PluginListenerHandle } from '@capacitor/core';
import { OverlayConfig } from '@/types';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      minimize: () => void;
      close: () => void;
      setAlwaysOnTop: (isPinned: boolean) => void;
      setOpacity: (opacityPercent: number) => void;
      setClickThrough: (isEnabled: boolean) => void;
    };
  }
}

export interface ZChatOverlayPlugin {
  showOverlay(options?: {
    opacity?: number;
    isClickThrough?: boolean;
    channelTitle?: string;
    recentMessagesJson?: string;
  }): Promise<{ success: boolean }>;
  hideOverlay(): Promise<{ success: boolean }>;
  setOpacity(options: { opacity: number }): Promise<{ success: boolean }>;
  setClickThrough(options: { enabled: boolean }): Promise<{ success: boolean }>;
  updateUnreadCount(options: { count: number }): Promise<{ success: boolean }>;
  updateChatMessages(options: { channelTitle?: string; messagesJson: string }): Promise<{ success: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ requested: boolean }>;
  addListener(
    eventName: 'overlaySendMessage',
    listenerFunc: (data: { text: string }) => void
  ): Promise<PluginListenerHandle>;
}

const NativeOverlay = registerPlugin<ZChatOverlayPlugin>('ZChatOverlay');

export class OverlayBridge {
  private static isNative = Capacitor.isNativePlatform();
  private static messageListenerHandle: PluginListenerHandle | null = null;

  public static isNativePlatform(): boolean {
    return this.isNative;
  }

  public static isDesktop(): boolean {
    return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
  }

  /**
   * Checks if overlay permission is granted
   */
  public static async hasPermission(): Promise<boolean> {
    if (this.isDesktop()) return true;
    if (!this.isNative) return true;
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
    if (this.isDesktop()) return;
    if (!this.isNative) return;
    try {
      await NativeOverlay.requestOverlayPermission();
    } catch (err) {
      console.warn('Native requestOverlayPermission failed:', err);
    }
  }

  /**
   * Launches the persistent floating Chat Head bubble / Desktop HUD
   */
  public static async show(
    config?: Partial<OverlayConfig> & {
      channelTitle?: string;
      recentMessagesJson?: string;
    }
  ): Promise<boolean> {
    if (this.isDesktop()) {
      window.electronAPI?.setAlwaysOnTop(true);
      if (config?.opacity !== undefined) {
        window.electronAPI?.setOpacity(config.opacity);
      }
      return true;
    }

    if (!this.isNative) {
      console.log('[Web HUD Simulator] Overlay shown with config:', config);
      return true;
    }

    try {
      const res = await NativeOverlay.showOverlay({
        opacity: config?.opacity ?? 85,
        isClickThrough: config?.isClickThrough ?? false,
        channelTitle: config?.channelTitle ?? 'ZENYTH HUD',
        recentMessagesJson: config?.recentMessagesJson ?? '[]',
      });
      return res.success;
    } catch (err) {
      console.error('Failed to show native overlay:', err);
      return false;
    }
  }

  /**
   * Hides the floating bubble / Desktop HUD
   */
  public static async hide(): Promise<boolean> {
    if (this.isDesktop()) {
      window.electronAPI?.setAlwaysOnTop(false);
      return true;
    }

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
   * Updates opacity (Ghost Mode: 10% to 100%)
   */
  public static async setOpacity(opacity: number): Promise<void> {
    const clamped = Math.max(10, Math.min(100, opacity));
    document.documentElement.style.setProperty('--hud-opacity', `${clamped / 100}`);

    if (this.isDesktop()) {
      window.electronAPI?.setOpacity(clamped);
      return;
    }

    if (this.isNative) {
      try {
        await NativeOverlay.setOpacity({ opacity: clamped });
      } catch (err) {
        console.warn('Failed to update native overlay opacity:', err);
      }
    }
  }

  /**
   * Toggles Click-Through Mode (pass clicks through to game)
   */
  public static async setClickThrough(enabled: boolean): Promise<void> {
    if (this.isDesktop()) {
      window.electronAPI?.setClickThrough(enabled);
      return;
    }

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

  /**
   * Updates the live messages and title inside the native floating overlay
   */
  public static async updateChatData(channelTitle: string, messagesJson: string): Promise<void> {
    if (this.isNative) {
      try {
        await NativeOverlay.updateChatMessages({
          channelTitle,
          messagesJson,
        });
      } catch (err) {
        console.warn('Failed to update chat messages in overlay:', err);
      }
    }
  }

  /**
   * Listens for messages sent from the native floating overlay
   */
  public static async initMessageListener(onSendMessage: (text: string) => Promise<void>): Promise<void> {
    if (!this.isNative) return;

    if (this.messageListenerHandle) {
      this.messageListenerHandle.remove();
      this.messageListenerHandle = null;
    }

    try {
      this.messageListenerHandle = await NativeOverlay.addListener('overlaySendMessage', async (data) => {
        if (data && data.text) {
          await onSendMessage(data.text);
        }
      });
    } catch (err) {
      console.warn('Failed to register overlaySendMessage listener:', err);
    }
  }
}
