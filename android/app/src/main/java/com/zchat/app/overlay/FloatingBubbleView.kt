package com.zchat.app.overlay

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.DisplayMetrics
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.OvershootInterpolator
import android.view.inputmethod.InputMethodManager
import android.widget.*
import org.json.JSONArray
import org.json.JSONObject

@SuppressLint("ViewConstructor")
class FloatingBubbleView(
    context: Context,
    private val windowManager: WindowManager,
    val layoutParams: WindowManager.LayoutParams,
    private val onSendMessageListener: (String) -> Unit,
    private val onCloseOverlayListener: () -> Unit
) : FrameLayout(context) {

    private val density = context.resources.displayMetrics.density
    private val bubbleSize = (56 * density).toInt()
    private val panelWidth = (340 * density).toInt()
    private val panelHeight = (420 * density).toInt()

    private var isExpanded = false
    private var isClickThrough = false

    // Bubble components
    private val bubbleLayout: FrameLayout
    private val iconView: ImageView
    private val badgeView: TextView

    // Panel components
    private val panelLayout: LinearLayout
    private val channelTitleView: TextView
    private val messagesLayout: LinearLayout
    private val messagesScrollView: ScrollView
    private val replyInputView: EditText
    private val clickThroughBtn: TextView

    // Drag state
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private val touchSlop = 10f

    init {
        layoutParams.width = bubbleSize
        layoutParams.height = bubbleSize
        layoutParams.gravity = Gravity.TOP or Gravity.START
        layoutParams.x = 20
        layoutParams.y = (200 * density).toInt()

        // =====================================================================
        // 1. FLOATING BUBBLE VIEW
        // =====================================================================
        bubbleLayout = FrameLayout(context).apply {
            val bgDrawable = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                colors = intArrayOf(Color.parseColor("#080A0F"), Color.parseColor("#0F1420"))
                orientation = GradientDrawable.Orientation.TL_BR
                setStroke((2.5f * density).toInt(), Color.parseColor("#00F0FF"))
            }
            background = bgDrawable
            elevation = 16f * density
        }

        iconView = ImageView(context).apply {
            setImageResource(com.zchat.app.R.drawable.ic_zchat_bubble)
            scaleType = ImageView.ScaleType.FIT_CENTER
            val padding = (4 * density).toInt()
            setPadding(padding, padding, padding, padding)
        }
        bubbleLayout.addView(iconView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))

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
        bubbleLayout.addView(badgeView)

        setupBubbleTouch()
        addView(bubbleLayout, LayoutParams(bubbleSize, bubbleSize))

        // =====================================================================
        // 2. EXPANDED CHAT PANEL VIEW (Full UI matching FloatingOverlayHUD)
        // =====================================================================
        panelLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            val panelBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 10f * density
                setColor(Color.parseColor("#080A0F"))
                setStroke((1.5f * density).toInt(), Color.parseColor("#44FFFFFF"))
            }
            background = panelBg
            elevation = 20f * density
            visibility = View.GONE
        }

        // --- Panel Header Bar ---
        val headerBar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((10 * density).toInt(), (8 * density).toInt(), (10 * density).toInt(), (8 * density).toInt())
            val headerBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = floatArrayOf(
                    10f * density, 10f * density,
                    10f * density, 10f * density,
                    0f, 0f, 0f, 0f
                )
                setColor(Color.parseColor("#0C0F14"))
            }
            background = headerBg
        }

        // Header Title
        channelTitleView = TextView(context).apply {
            text = "ZENYTH HUD"
            setTextColor(Color.WHITE)
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        headerBar.addView(channelTitleView)

        // Ghost Mode (Alpha) Controls
        val alphaLabel = TextView(context).apply {
            text = "GHOST"
            setTextColor(Color.parseColor("#A0AAB8"))
            textSize = 9f
            typeface = Typeface.MONOSPACE
            setPadding((4 * density).toInt(), 0, (2 * density).toInt(), 0)
        }
        headerBar.addView(alphaLabel)

        val alphaSeekBar = SeekBar(context).apply {
            max = 100
            progress = 85
            layoutParams = LinearLayout.LayoutParams((60 * density).toInt(), LinearLayout.LayoutParams.WRAP_CONTENT)
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    val clamped = Math.max(10, progress)
                    setOpacity(clamped)
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
        }
        headerBar.addView(alphaSeekBar)

        // Click-Through Toggle Button
        clickThroughBtn = TextView(context).apply {
            text = "TOUCH"
            setTextColor(Color.parseColor("#00F0FF"))
            textSize = 9f
            typeface = Typeface.MONOSPACE
            val btnBg = GradientDrawable().apply {
                cornerRadius = 3f * density
                setColor(Color.parseColor("#141824"))
                setStroke((1f * density).toInt(), Color.parseColor("#00F0FF"))
            }
            background = btnBg
            setPadding((6 * density).toInt(), (3 * density).toInt(), (6 * density).toInt(), (3 * density).toInt())
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                marginStart = (4 * density).toInt()
                marginEnd = (4 * density).toInt()
            }
            layoutParams = lp
            setOnClickListener {
                toggleClickThrough()
            }
        }
        headerBar.addView(clickThroughBtn)

        // Minimize Button (-)
        val minimizeBtn = TextView(context).apply {
            text = "—"
            setTextColor(Color.WHITE)
            textSize = 12f
            gravity = Gravity.CENTER
            setPadding((8 * density).toInt(), (2 * density).toInt(), (8 * density).toInt(), (2 * density).toInt())
            setOnClickListener {
                collapseToBubble()
            }
        }
        headerBar.addView(minimizeBtn)

        // Close Button (X)
        val closeBtn = TextView(context).apply {
            text = "✕"
            setTextColor(Color.parseColor("#F43F5E"))
            textSize = 12f
            gravity = Gravity.CENTER
            setPadding((6 * density).toInt(), (2 * density).toInt(), (6 * density).toInt(), (2 * density).toInt())
            setOnClickListener {
                onCloseOverlayListener()
            }
        }
        headerBar.addView(closeBtn)

        setupPanelHeaderDrag(headerBar)
        panelLayout.addView(headerBar)

        // --- Messages Stream (Scrollable) ---
        messagesLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((10 * density).toInt(), (8 * density).toInt(), (10 * density).toInt(), (8 * density).toInt())
        }

        messagesScrollView = ScrollView(context).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
            addView(messagesLayout)
        }
        panelLayout.addView(messagesScrollView)

        // Populate initial placeholder
        addSystemMessage("Zenyth Overlay Connected. Messages travel over encrypted P2P mesh.")

        // --- Quick Reply Bar ---
        val replyBar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((8 * density).toInt(), (6 * density).toInt(), (8 * density).toInt(), (8 * density).toInt())
            val replyBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = floatArrayOf(
                    0f, 0f, 0f, 0f,
                    10f * density, 10f * density,
                    10f * density, 10f * density
                )
                setColor(Color.parseColor("#0C0F14"))
            }
            background = replyBg
        }

        replyInputView = EditText(context).apply {
            hint = "Quick callout..."
            setHintTextColor(Color.parseColor("#667085"))
            setTextColor(Color.WHITE)
            textSize = 12f
            val inputBg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(Color.parseColor("#040608"))
                setStroke((1f * density).toInt(), Color.parseColor("#33FFFFFF"))
            }
            background = inputBg
            setPadding((8 * density).toInt(), (6 * density).toInt(), (8 * density).toInt(), (6 * density).toInt())
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            maxLines = 2
        }
        replyBar.addView(replyInputView)

        val sendBtn = TextView(context).apply {
            text = "SEND"
            setTextColor(Color.BLACK)
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            val sendBg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(Color.WHITE)
            }
            background = sendBg
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, (32 * density).toInt()).apply {
                marginStart = (6 * density).toInt()
            }
            layoutParams = lp
            setPadding((12 * density).toInt(), 0, (12 * density).toInt(), 0)
            setOnClickListener {
                val text = replyInputView.text.toString().trim()
                if (text.isNotEmpty()) {
                    onSendMessageListener(text)
                    addMessageCard("You", text, isMe = true)
                    replyInputView.setText("")
                }
            }
        }
        replyBar.addView(sendBtn)
        panelLayout.addView(replyBar)

        addView(panelLayout, LayoutParams(panelWidth, panelHeight))
    }

    // =========================================================================
    // TOUCH & DRAG LOGIC
    // =========================================================================
    private fun setupBubbleTouch() {
        bubbleLayout.setOnTouchListener { _, event ->
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
                        expandToPanel()
                    } else {
                        snapBubbleToEdge()
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun setupPanelHeaderDrag(headerView: View) {
        headerView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = layoutParams.x
                    initialY = layoutParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - initialTouchX
                    val dy = event.rawY - initialTouchY
                    layoutParams.x = initialX + dx.toInt()
                    layoutParams.y = initialY + dy.toInt()
                    windowManager.updateViewLayout(this, layoutParams)
                    true
                }
                else -> false
            }
        }
    }

    // =========================================================================
    // STATE TRANSITIONS (BUBBLE <-> PANEL)
    // =========================================================================
    fun expandToPanel() {
        isExpanded = true
        bubbleLayout.visibility = View.GONE
        panelLayout.visibility = View.VISIBLE

        layoutParams.width = panelWidth
        layoutParams.height = panelHeight
        // Make window focusable so on-screen keyboard appears when typing
        layoutParams.flags = WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED

        windowManager.updateViewLayout(this, layoutParams)
    }

    fun collapseToBubble() {
        isExpanded = false
        // Hide keyboard if open
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.hideSoftInputFromWindow(replyInputView.windowToken, 0)

        panelLayout.visibility = View.GONE
        bubbleLayout.visibility = View.VISIBLE

        layoutParams.width = bubbleSize
        layoutParams.height = bubbleSize
        // Restore non-focusable flag so clicks pass to background apps
        layoutParams.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED

        snapBubbleToEdge()
    }

    private fun snapBubbleToEdge() {
        val displayMetrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        val screenWidth = displayMetrics.widthPixels
        val currentX = layoutParams.x

        val targetX = if (currentX + bubbleSize / 2 < screenWidth / 2) {
            10
        } else {
            screenWidth - bubbleSize - 10
        }

        val animator = ValueAnimator.ofInt(currentX, targetX).apply {
            duration = 300
            interpolator = OvershootInterpolator(1.1f)
            addUpdateListener { anim ->
                layoutParams.x = anim.animatedValue as Int
                try {
                    windowManager.updateViewLayout(this@FloatingBubbleView, layoutParams)
                } catch (e: Exception) {}
            }
        }
        animator.start()
    }

    // =========================================================================
    // CHAT DATA & MESSAGE RENDERING
    // =========================================================================
    fun updateChatData(channelTitle: String, messagesJson: String) {
        post {
            if (channelTitle.isNotEmpty()) {
                channelTitleView.text = channelTitle.uppercase()
            }
            try {
                messagesLayout.removeAllViews()
                val array = JSONArray(messagesJson)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val sender = obj.optString("senderTag", obj.optString("authorAlias", "Teammate"))
                    val content = obj.optString("content", "")
                    val isMe = obj.optBoolean("isMe", false)
                    addMessageCard(sender, content, isMe)
                }
                messagesScrollView.post {
                    messagesScrollView.fullScroll(ScrollView.FOCUS_DOWN)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun addMessageCard(sender: String, content: String, isMe: Boolean) {
        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            val bg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(if (isMe) Color.parseColor("#202838") else Color.parseColor("#141822"))
                setStroke((1f * density).toInt(), if (isMe) Color.parseColor("#00F0FF") else Color.parseColor("#22FFFFFF"))
            }
            background = bg
            setPadding((8 * density).toInt(), (6 * density).toInt(), (8 * density).toInt(), (6 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = if (isMe) Gravity.END else Gravity.START
                bottomMargin = (6 * density).toInt()
            }
            layoutParams = lp
        }

        val senderView = TextView(context).apply {
            text = sender
            setTextColor(if (isMe) Color.parseColor("#00F0FF") else Color.parseColor("#A0AAB8"))
            textSize = 9f
            typeface = Typeface.MONOSPACE
        }
        card.addView(senderView)

        val contentView = TextView(context).apply {
            text = content
            setTextColor(Color.WHITE)
            textSize = 12f
            setPadding(0, (2 * density).toInt(), 0, 0)
        }
        card.addView(contentView)

        messagesLayout.addView(card)
        messagesScrollView.post {
            messagesScrollView.fullScroll(ScrollView.FOCUS_DOWN)
        }
    }

    private fun addSystemMessage(content: String) {
        val tv = TextView(context).apply {
            text = content
            setTextColor(Color.parseColor("#667085"))
            textSize = 10f
            gravity = Gravity.CENTER
            setPadding(0, (8 * density).toInt(), 0, (8 * density).toInt())
            typeface = Typeface.MONOSPACE
        }
        messagesLayout.addView(tv)
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
            } catch (e: Exception) {}
        }
    }

    fun toggleClickThrough() {
        setClickThrough(!isClickThrough)
    }

    fun setClickThrough(enabled: Boolean) {
        isClickThrough = enabled
        post {
            if (enabled) {
                layoutParams.flags = layoutParams.flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                clickThroughBtn.text = "PASS-THRU"
                clickThroughBtn.setTextColor(Color.parseColor("#F59E0B"))
            } else {
                layoutParams.flags = layoutParams.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
                clickThroughBtn.text = "TOUCH"
                clickThroughBtn.setTextColor(Color.parseColor("#00F0FF"))
            }
            try {
                windowManager.updateViewLayout(this, layoutParams)
            } catch (e: Exception) {}
        }
    }
}
