package com.zchat.app.overlay

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView

@SuppressLint("ViewConstructor")
class FloatingBubbleView(
    context: Context,
    private val windowManager: WindowManager,
    val layoutParams: WindowManager.LayoutParams,
    private val onBubbleClick: () -> Unit
) : FrameLayout(context) {

    private val badgeView: TextView
    private val iconView: ImageView

    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private val touchSlop = 10f

    init {
        val density = context.resources.displayMetrics.density
        val bubbleSize = (56 * density).toInt()

        layoutParams.width = bubbleSize
        layoutParams.height = bubbleSize
        layoutParams.gravity = Gravity.TOP or Gravity.START
        layoutParams.x = 20
        layoutParams.y = (200 * density).toInt()

        // Background: Cyber glass gradient circle with cyan border
        val bgDrawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            colors = intArrayOf(Color.parseColor("#00F0FF"), Color.parseColor("#9D4EDD"))
            orientation = GradientDrawable.Orientation.TL_BR
            setStroke((2 * density).toInt(), Color.parseColor("#00F0FF"))
        }
        background = bgDrawable
        elevation = 16f * density

        // Main Icon
        iconView = ImageView(context).apply {
            setImageResource(android.R.drawable.ic_dialog_email)
            setColorFilter(Color.parseColor("#080A0F"))
            val padding = (12 * density).toInt()
            setPadding(padding, padding, padding, padding)
        }
        addView(iconView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))

        // Badge View for unread message count
        badgeView = TextView(context).apply {
            val badgeSize = (20 * density).toInt()
            layoutParams = LayoutParams(badgeSize, badgeSize).apply {
                gravity = Gravity.TOP or Gravity.END
            }
            val badgeBg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#F43F5E"))
            }
            background = badgeBg
            setTextColor(Color.WHITE)
            textSize = 10f
            gravity = Gravity.CENTER
            visibility = View.GONE
        }
        addView(badgeView)

        setupTouchListener()
    }

    private fun setupTouchListener() {
        setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = layoutParams.x
                    initialY = layoutParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - initialTouchX
                    val dy = event.rawY - initialTouchY
                    if (Math.abs(dx) > touchSlop || Math.abs(dy) > touchSlop) {
                        isDragging = true
                    }
                    if (isDragging) {
                        layoutParams.x = initialX + dx.toInt()
                        layoutParams.y = initialY + dy.toInt()
                        windowManager.updateViewLayout(this, layoutParams)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        onBubbleClick()
                    } else {
                        snapToNearestEdge()
                    }
                    true
                }
                else -> false
            }
        }
    }

    /**
     * Smoothly animates bubble to left or right margin with overshoot spring physics
     */
    private fun snapToNearestEdge() {
        val displayMetrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        val screenWidth = displayMetrics.widthPixels
        val currentX = layoutParams.x
        val bubbleWidth = width.takeIf { it > 0 } ?: (56 * resources.displayMetrics.density).toInt()

        val targetX = if (currentX + bubbleWidth / 2 < screenWidth / 2) {
            10 // Snap to left margin
        } else {
            screenWidth - bubbleWidth - 10 // Snap to right margin
        }

        val animator = ValueAnimator.ofInt(currentX, targetX).apply {
            duration = 300
            interpolator = OvershootInterpolator(1.1f)
            addUpdateListener { anim ->
                layoutParams.x = anim.animatedValue as Int
                try {
                    windowManager.updateViewLayout(this@FloatingBubbleView, layoutParams)
                } catch (e: Exception) {
                    // View may be detached
                }
            }
        }
        animator.start()
    }

    fun setUnreadCount(count: Int) {
        post {
            if (count > 0) {
                badgeView.text = if (count > 99) "99+" else count.toString()
                badgeView.visibility = View.VISIBLE
            } else {
                badgeView.visibility = View.GONE
            }
        }
    }

    fun setOpacity(alphaPercent: Int) {
        post {
            layoutParams.alpha = (alphaPercent.coerceIn(10, 100)) / 100f
            try {
                windowManager.updateViewLayout(this, layoutParams)
            } catch (e: Exception) {
                // Ignore if detached
            }
        }
    }

    fun setClickThrough(enabled: Boolean) {
        post {
            if (enabled) {
                layoutParams.flags = layoutParams.flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
            } else {
                layoutParams.flags = layoutParams.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
            }
            try {
                windowManager.updateViewLayout(this, layoutParams)
            } catch (e: Exception) {
                // Ignore if detached
            }
        }
    }
}
