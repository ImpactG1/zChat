package com.zchat.app.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.zchat.app.MainActivity

class OverlayService : Service() {

    companion object {
        const val CHANNEL_ID = "zchat_overlay_hud_channel"
        const val NOTIFICATION_ID = 4040

        const val ACTION_SHOW = "com.zchat.app.overlay.ACTION_SHOW"
        const val ACTION_HIDE = "com.zchat.app.overlay.ACTION_HIDE"
        const val ACTION_SET_OPACITY = "com.zchat.app.overlay.ACTION_SET_OPACITY"
        const val ACTION_SET_CLICK_THROUGH = "com.zchat.app.overlay.ACTION_SET_CLICK_THROUGH"
        const val ACTION_UPDATE_BADGE = "com.zchat.app.overlay.ACTION_UPDATE_BADGE"

        const val EXTRA_OPACITY = "extra_opacity"
        const val EXTRA_CLICK_THROUGH = "extra_click_through"
        const val EXTRA_BADGE_COUNT = "extra_badge_count"
    }

    private var windowManager: WindowManager? = null
    private var bubbleView: FloatingBubbleView? = null
    private var isViewAttached = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification())
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> {
                val opacity = intent.getIntExtra(EXTRA_OPACITY, 85)
                val clickThrough = intent.getBooleanExtra(EXTRA_CLICK_THROUGH, false)
                attachBubbleView(opacity, clickThrough)
            }
            ACTION_HIDE -> {
                detachBubbleView()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
            ACTION_SET_OPACITY -> {
                val opacity = intent.getIntExtra(EXTRA_OPACITY, 85)
                bubbleView?.setOpacity(opacity)
            }
            ACTION_SET_CLICK_THROUGH -> {
                val clickThrough = intent.getBooleanExtra(EXTRA_CLICK_THROUGH, false)
                bubbleView?.setClickThrough(clickThrough)
            }
            ACTION_UPDATE_BADGE -> {
                val count = intent.getIntExtra(EXTRA_BADGE_COUNT, 0)
                bubbleView?.setUnreadCount(count)
            }
        }
        return START_STICKY
    }

    private fun attachBubbleView(initialOpacity: Int, initialClickThrough: Boolean) {
        if (isViewAttached) return

        val wm = windowManager ?: return

        var layoutFlags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED

        if (initialClickThrough) {
            layoutFlags = layoutFlags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            layoutFlags,
            PixelFormat.TRANSLUCENT
        ).apply {
            alpha = (initialOpacity.coerceIn(10, 100)) / 100f
        }

        bubbleView = FloatingBubbleView(this, wm, params) {
            // On Bubble Click: Bring MainActivity to foreground
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(launchIntent)
        }

        try {
            wm.addView(bubbleView, params)
            isViewAttached = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun detachBubbleView() {
        if (!isViewAttached) return
        try {
            windowManager?.removeView(bubbleView)
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            bubbleView = null
            isViewAttached = false
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "zChat Gamer HUD Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the always-on-top chat heads overlay active during gaming"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("zChat Gamer HUD Active")
            .setContentText("Always-on-top chat head running")
            .setSmallIcon(com.zchat.app.R.drawable.ic_zchat_bubble)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        detachBubbleView()
    }
}
