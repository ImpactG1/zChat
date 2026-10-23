package com.zchat.app.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
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
        const val ACTION_UPDATE_CHAT = "com.zchat.app.overlay.ACTION_UPDATE_CHAT"

        const val EXTRA_OPACITY = "extra_opacity"
        const val EXTRA_CLICK_THROUGH = "extra_click_through"
        const val EXTRA_BADGE_COUNT = "extra_badge_count"
        const val EXTRA_CHANNEL_TITLE = "extra_channel_title"
        const val EXTRA_MESSAGES_JSON = "extra_messages_json"
        const val EXTRA_ACTIVE_PUBKEY = "extra_active_pubkey"
        const val EXTRA_CONTACTS_JSON = "extra_contacts_json"
    }

    private var windowManager: WindowManager? = null
    private var bubbleView: FloatingBubbleView? = null
    private var isViewAttached = false

    // Secondary touchable window for restoring touch when pass-through is active
    private var touchRestorePillView: View? = null
    private var isPillAttached = false
    private var isCurrentPassThrough = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification(isPassThru = false))
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> {
                val opacity = intent.getIntExtra(EXTRA_OPACITY, 85)
                val clickThrough = intent.getBooleanExtra(EXTRA_CLICK_THROUGH, false)
                val title = intent.getStringExtra(EXTRA_CHANNEL_TITLE) ?: "ZENYTH"
                val messagesJson = intent.getStringExtra(EXTRA_MESSAGES_JSON) ?: "[]"
                val activePubkey = intent.getStringExtra(EXTRA_ACTIVE_PUBKEY) ?: ""
                val contactsJson = intent.getStringExtra(EXTRA_CONTACTS_JSON) ?: "[]"
                attachBubbleView(opacity, clickThrough, title, messagesJson, activePubkey, contactsJson)
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
                handleSetClickThrough(clickThrough)
            }
            ACTION_UPDATE_BADGE -> {
                val count = intent.getIntExtra(EXTRA_BADGE_COUNT, 0)
                bubbleView?.setUnreadCount(count)
            }
            ACTION_UPDATE_CHAT -> {
                val title = intent.getStringExtra(EXTRA_CHANNEL_TITLE) ?: ""
                val messagesJson = intent.getStringExtra(EXTRA_MESSAGES_JSON) ?: "[]"
                val activePubkey = intent.getStringExtra(EXTRA_ACTIVE_PUBKEY) ?: ""
                val contactsJson = intent.getStringExtra(EXTRA_CONTACTS_JSON) ?: "[]"
                bubbleView?.updateChatData(title, messagesJson, activePubkey, contactsJson)
            }
        }
        return START_STICKY
    }

    private fun attachBubbleView(
        initialOpacity: Int,
        initialClickThrough: Boolean,
        initialTitle: String,
        initialMessagesJson: String,
        initialActivePubkey: String = "",
        initialContactsJson: String = "[]"
    ) {
        if (isViewAttached) {
            bubbleView?.setOpacity(initialOpacity)
            bubbleView?.updateChatData(initialTitle, initialMessagesJson, initialActivePubkey, initialContactsJson)
            if (initialClickThrough != isCurrentPassThrough) {
                handleSetClickThrough(initialClickThrough)
            }
            return
        }

        val wm = windowManager ?: return

        var layoutFlags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
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
            alpha = 1.0f // Surface is 100% solid; ghost effect is background-only
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }

        bubbleView = FloatingBubbleView(
            context = this,
            windowManager = wm,
            layoutParams = params,
            onSendMessageListener = { text ->
                ZChatOverlayPlugin.notifyMessageSent(text)
            },
            onSelectContactListener = { pubkey ->
                ZChatOverlayPlugin.notifyContactSelected(pubkey)
            },
            onToggleClickThroughListener = { enabled ->
                handleSetClickThrough(enabled)
            },
            onCloseOverlayListener = {
                detachBubbleView()
                stopSelf()
            }
        )

        try {
            wm.addView(bubbleView, params)
            isViewAttached = true
            bubbleView?.setOpacity(initialOpacity)
            bubbleView?.updateChatData(initialTitle, initialMessagesJson, initialActivePubkey, initialContactsJson)
            if (initialClickThrough) {
                handleSetClickThrough(true)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun detachBubbleView() {
        hideTouchRestorePill()
        if (isViewAttached) {
            try {
                windowManager?.removeView(bubbleView)
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                bubbleView = null
                isViewAttached = false
            }
        }
        ZChatOverlayPlugin.notifyOverlayClosed()
    }

    // =========================================================================
    // PASS-THROUGH HANDLER & TOUCH RESTORATION
    // =========================================================================
    private fun handleSetClickThrough(enabled: Boolean) {
        isCurrentPassThrough = enabled
        bubbleView?.setClickThrough(enabled)
        if (enabled) {
            showTouchRestorePill()
        } else {
            hideTouchRestorePill()
        }

        val notification = buildForegroundNotification(isPassThru = enabled)
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(NOTIFICATION_ID, notification)
    }

    private fun showTouchRestorePill() {
        if (isPillAttached) return
        val wm = windowManager ?: return
        val density = resources.displayMetrics.density

        val pillLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val bg = GradientDrawable().apply {
                cornerRadius = 16f * density
                setColor(Color.parseColor("#F59E0B")) // Amber warning badge
                setStroke((1.5f * density).toInt(), Color.WHITE)
            }
            background = bg
            elevation = 30f * density
            setPadding(
                (14 * density).toInt(),
                (7 * density).toInt(),
                (14 * density).toInt(),
                (7 * density).toInt()
            )

            val tv = TextView(context).apply {
                text = "⚡ PASS-THRU  [RESTORE TOUCH]"
                setTextColor(Color.BLACK)
                textSize = 10f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
            }
            addView(tv)

            setOnClickListener {
                handleSetClickThrough(false)
            }
        }

        touchRestorePillView = pillLayout

        val pillParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = (20 * density).toInt()
        }

        try {
            wm.addView(pillLayout, pillParams)
            isPillAttached = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun hideTouchRestorePill() {
        if (!isPillAttached) return
        try {
            windowManager?.removeView(touchRestorePillView)
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            touchRestorePillView = null
            isPillAttached = false
        }
    }

    // =========================================================================
    // NOTIFICATIONS
    // =========================================================================
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

    private fun buildForegroundNotification(isPassThru: Boolean): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("zChat HUD Active")
            .setContentText(
                if (isPassThru) "Pass-Through active (touches pass to game)" else "Always-on-top HUD running"
            )
            .setSmallIcon(com.zchat.app.R.drawable.ic_zchat_bubble)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)

        if (isPassThru) {
            val restoreIntent = Intent(this, OverlayService::class.java).apply {
                action = ACTION_SET_CLICK_THROUGH
                putExtra(EXTRA_CLICK_THROUGH, false)
            }
            val restorePendingIntent = PendingIntent.getService(
                this,
                1,
                restoreIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            builder.addAction(
                com.zchat.app.R.drawable.ic_zchat_bubble,
                "RESTORE TOUCH",
                restorePendingIntent
            )
        }

        return builder.build()
    }

    override fun onDestroy() {
        super.onDestroy()
        detachBubbleView()
    }
}
