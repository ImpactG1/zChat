package com.zchat.app.overlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "ZChatOverlay")
class ZChatOverlayPlugin : Plugin() {

    companion object {
        private var instance: ZChatOverlayPlugin? = null
        @JvmField
        var isOverlayActive: Boolean = false

        fun notifyMessageSent(text: String) {
            instance?.let { plugin ->
                val ret = JSObject().apply {
                    put("text", text)
                }
                plugin.notifyListeners("overlaySendMessage", ret)
            }
        }

        fun notifyOverlayClosed() {
            isOverlayActive = false
            instance?.let { plugin ->
                plugin.notifyListeners("overlayClosed", JSObject())
            }
        }
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun checkOverlayPermission(call: PluginCall) {
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
        val ret = JSObject().apply {
            put("granted", granted)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            activity.startActivity(intent)
            call.resolve(JSObject().put("requested", true))
        } else {
            call.resolve(JSObject().put("requested", false))
        }
    }

    @PluginMethod
    fun showOverlay(call: PluginCall) {
        val opacity = call.getInt("opacity", 85) ?: 85
        val clickThrough = call.getBoolean("isClickThrough", false) ?: false
        val title = call.getString("channelTitle", "ZENYTH HUD") ?: "ZENYTH HUD"
        val messagesJson = call.getString("recentMessagesJson", "[]") ?: "[]"

        val intent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_SHOW
            putExtra(OverlayService.EXTRA_OPACITY, opacity)
            putExtra(OverlayService.EXTRA_CLICK_THROUGH, clickThrough)
            putExtra(OverlayService.EXTRA_CHANNEL_TITLE, title)
            putExtra(OverlayService.EXTRA_MESSAGES_JSON, messagesJson)
        }
        ContextCompat.startForegroundService(context, intent)
        isOverlayActive = true

        // Minimize MainActivity to background so user is directly over their game/home screen
        activity.runOnUiThread {
            activity.moveTaskToBack(true)
        }

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun hideOverlay(call: PluginCall) {
        isOverlayActive = false
        val intent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_HIDE
        }
        context.startService(intent)

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun setOpacity(call: PluginCall) {
        val opacity = call.getInt("opacity", 85) ?: 85
        val intent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_SET_OPACITY
            putExtra(OverlayService.EXTRA_OPACITY, opacity)
        }
        context.startService(intent)

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun setClickThrough(call: PluginCall) {
        val enabled = call.getBoolean("enabled", false) ?: false
        val intent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_SET_CLICK_THROUGH
            putExtra(OverlayService.EXTRA_CLICK_THROUGH, enabled)
        }
        context.startService(intent)

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun updateUnreadCount(call: PluginCall) {
        val count = call.getInt("count", 0) ?: 0
        val intent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_UPDATE_BADGE
            putExtra(OverlayService.EXTRA_BADGE_COUNT, count)
        }
        context.startService(intent)

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun updateChatMessages(call: PluginCall) {
        val title = call.getString("channelTitle", "") ?: ""
        val messagesJson = call.getString("messagesJson", "[]") ?: "[]"

        val intent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_UPDATE_CHAT
            putExtra(OverlayService.EXTRA_CHANNEL_TITLE, title)
            putExtra(OverlayService.EXTRA_MESSAGES_JSON, messagesJson)
        }
        context.startService(intent)

        call.resolve(JSObject().put("success", true))
    }
}
