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

        val intent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_SHOW
            putExtra(OverlayService.EXTRA_OPACITY, opacity)
            putExtra(OverlayService.EXTRA_CLICK_THROUGH, clickThrough)
        }
        ContextCompat.startForegroundService(context, intent)

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun hideOverlay(call: PluginCall) {
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
}
