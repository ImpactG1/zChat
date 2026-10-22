package com.zchat.app.overlay

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.OvershootInterpolator
import android.view.inputmethod.InputMethodManager
import android.widget.*
import org.json.JSONArray

@SuppressLint("ViewConstructor")
class FloatingBubbleView(
    context: Context,
    private val windowManager: WindowManager,
    val layoutParams: WindowManager.LayoutParams,
    private val onSendMessageListener: (String) -> Unit,
    private val onToggleClickThroughListener: (Boolean) -> Unit,
    private val onCloseOverlayListener: () -> Unit
) : FrameLayout(context) {

    private val density = context.resources.displayMetrics.density
    private val bubbleSize = (58 * density).toInt()
    private val panelWidth = Math.min((340 * density).toInt(), (context.resources.displayMetrics.widthPixels * 0.92f).toInt())
    private val panelHeight = Math.min((430 * density).toInt(), (context.resources.displayMetrics.heightPixels * 0.70f).toInt())

    private var isExpanded = true
    private var isClickThrough = false
    private var currentOpacityPercent = 85

    // Minimized Bubble components
    private val bubbleLayout: FrameLayout
    private val iconView: ImageView
    private val badgeView: TextView

    // Maximized Panel components
    private val panelLayout: LinearLayout
    private val channelTitleView: TextView
    private val alphaPercentText: TextView
    private val clickThroughBtn: TextView
    private val messagesLayout: LinearLayout
    private val messagesScrollView: ScrollView
    private val replyInputView: EditText

    // Touch & Drag state
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private val touchSlop = 12f

    init {
        // Window starts in Maximized state so user immediately sees HUD
        layoutParams.width = panelWidth
        layoutParams.height = panelHeight
        layoutParams.gravity = Gravity.TOP or Gravity.START
        layoutParams.x = 24
        layoutParams.y = (100 * density).toInt()
        layoutParams.alpha = 1.0f // Entire window surface is ALWAYS 100% opaque

        // =====================================================================
        // 1. MINIMIZED FLOATING BUBBLE (State 1)
        // =====================================================================
        bubbleLayout = FrameLayout(context).apply {
            val bgDrawable = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                colors = intArrayOf(Color.parseColor("#0A0D14"), Color.parseColor("#121824"))
                orientation = GradientDrawable.Orientation.TL_BR
                setStroke((2.5f * density).toInt(), Color.parseColor("#00F0FF"))
            }
            background = bgDrawable
            elevation = 20f * density
            visibility = View.GONE
        }

        iconView = ImageView(context).apply {
            setImageResource(com.zchat.app.R.drawable.ic_zchat_bubble)
            scaleType = ImageView.ScaleType.FIT_CENTER
            val pad = (6 * density).toInt()
            setPadding(pad, pad, pad, pad)
        }
        bubbleLayout.addView(iconView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))

        badgeView = TextView(context).apply {
            val bSize = (20 * density).toInt()
            layoutParams = LayoutParams(bSize, bSize).apply {
                gravity = Gravity.TOP or Gravity.END
            }
            val badgeBg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#F43F5E"))
            }
            background = badgeBg
            setTextColor(Color.WHITE)
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            visibility = View.GONE
        }
        bubbleLayout.addView(badgeView)
        setupBubbleTouch()
        addView(bubbleLayout, LayoutParams(bubbleSize, bubbleSize))

        // =====================================================================
        // 2. MAXIMIZED GAMER HUD PANEL (State 2)
        // =====================================================================
        panelLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            elevation = 25f * density
            visibility = View.VISIBLE
        }
        updateBackgroundTransparency()

        // --- Tactical Header Bar ---
        val headerBar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((10 * density).toInt(), (8 * density).toInt(), (10 * density).toInt(), (8 * density).toInt())
            val headerBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = floatArrayOf(
                    12f * density, 12f * density,
                    12f * density, 12f * density,
                    0f, 0f, 0f, 0f
                )
                setColor(Color.parseColor("#0C0F16"))
                setStroke((1f * density).toInt(), Color.parseColor("#26FFFFFF"))
            }
            background = headerBg
        }

        // Header Sigil Icon
        val headerIcon = ImageView(context).apply {
            setImageResource(com.zchat.app.R.drawable.ic_zchat_bubble)
            val iconS = (18 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(iconS, iconS).apply {
                marginEnd = (8 * density).toInt()
            }
        }
        headerBar.addView(headerIcon)

        // Channel Title & Status
        val titleContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        channelTitleView = TextView(context).apply {
            text = "ZENYTH HUD"
            setTextColor(Color.WHITE)
            textSize = 11.5f
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
        }
        titleContainer.addView(channelTitleView)

        val statusView = TextView(context).apply {
            text = "● P2P MESH"
            setTextColor(Color.parseColor("#00F0FF"))
            textSize = 8.5f
            typeface = Typeface.MONOSPACE
        }
        titleContainer.addView(statusView)
        headerBar.addView(titleContainer)

        // Ghost Mode (Transparency Slider)
        val ghostContainer = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val bg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(Color.parseColor("#141923"))
                setStroke((1f * density).toInt(), Color.parseColor("#33FFFFFF"))
            }
            background = bg
            setPadding((6 * density).toInt(), (3 * density).toInt(), (6 * density).toInt(), (3 * density).toInt())
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (6 * density).toInt()
            }
        }

        val ghostLabel = TextView(context).apply {
            text = "GHOST"
            setTextColor(Color.parseColor("#8892B0"))
            textSize = 8.5f
            typeface = Typeface.MONOSPACE
            setPadding(0, 0, (2 * density).toInt(), 0)
        }
        ghostContainer.addView(ghostLabel)

        val alphaSeekBar = SeekBar(context).apply {
            max = 100
            progress = currentOpacityPercent
            layoutParams = LinearLayout.LayoutParams((52 * density).toInt(), LinearLayout.LayoutParams.WRAP_CONTENT)
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    setOpacity(progress)
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
        }
        ghostContainer.addView(alphaSeekBar)

        alphaPercentText = TextView(context).apply {
            text = "${currentOpacityPercent}%"
            setTextColor(Color.WHITE)
            textSize = 8.5f
            typeface = Typeface.MONOSPACE
            setPadding((2 * density).toInt(), 0, 0, 0)
        }
        ghostContainer.addView(alphaPercentText)
        headerBar.addView(ghostContainer)

        // Pass-Through (Click-Through) Button
        clickThroughBtn = TextView(context).apply {
            text = "TOUCH"
            setTextColor(Color.parseColor("#00F0FF"))
            textSize = 9f
            typeface = Typeface.MONOSPACE
            val btnBg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(Color.parseColor("#141923"))
                setStroke((1f * density).toInt(), Color.parseColor("#00F0FF"))
            }
            background = btnBg
            setPadding((6 * density).toInt(), (4 * density).toInt(), (6 * density).toInt(), (4 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (6 * density).toInt()
            }
            layoutParams = lp
            setOnClickListener {
                onToggleClickThroughListener(!isClickThrough)
            }
        }
        headerBar.addView(clickThroughBtn)

        // Minimize Button ("MIN") -> Collapses to Bubble State
        val minimizeBtn = TextView(context).apply {
            text = "MIN"
            setTextColor(Color.parseColor("#CBD5E1"))
            textSize = 9f
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            val minBg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(Color.parseColor("#1A202C"))
                setStroke((1f * density).toInt(), Color.parseColor("#44FFFFFF"))
            }
            background = minBg
            setPadding((7 * density).toInt(), (4 * density).toInt(), (7 * density).toInt(), (4 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (5 * density).toInt()
            }
            layoutParams = lp
            setOnClickListener {
                collapseToBubble()
            }
        }
        headerBar.addView(minimizeBtn)

        // Close Button ("✕") -> Dismisses Overlay
        val closeBtn = TextView(context).apply {
            text = "✕"
            setTextColor(Color.parseColor("#F43F5E"))
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            val closeBg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(Color.parseColor("#261418"))
                setStroke((1f * density).toInt(), Color.parseColor("#66F43F5E"))
            }
            background = closeBg
            setPadding((7 * density).toInt(), (3 * density).toInt(), (7 * density).toInt(), (3 * density).toInt())
            setOnClickListener {
                onCloseOverlayListener()
            }
        }
        headerBar.addView(closeBtn)

        setupPanelHeaderDrag(headerBar)
        panelLayout.addView(headerBar)

        // --- Live Messages Stream (Scrollable) ---
        messagesLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((10 * density).toInt(), (8 * density).toInt(), (10 * density).toInt(), (8 * density).toInt())
        }

        messagesScrollView = ScrollView(context).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
            setBackgroundColor(Color.TRANSPARENT)
            addView(messagesLayout)
        }
        panelLayout.addView(messagesScrollView)

        addSystemMessage("Zenyth HUD Active // Encrypted P2P Mesh")

        // --- Tactical Quick Reply Bar ---
        val replyBar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((8 * density).toInt(), (6 * density).toInt(), (8 * density).toInt(), (8 * density).toInt())
            val replyBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = floatArrayOf(
                    0f, 0f, 0f, 0f,
                    12f * density, 12f * density,
                    12f * density, 12f * density
                )
                setColor(Color.parseColor("#0C0F16"))
                setStroke((1f * density).toInt(), Color.parseColor("#26FFFFFF"))
            }
            background = replyBg
        }

        replyInputView = EditText(context).apply {
            hint = "Quick callout..."
            setHintTextColor(Color.parseColor("#64748B"))
            setTextColor(Color.WHITE)
            textSize = 12f
            val inputBg = GradientDrawable().apply {
                cornerRadius = 4f * density
                setColor(Color.parseColor("#040609"))
                setStroke((1f * density).toInt(), Color.parseColor("#33FFFFFF"))
            }
            background = inputBg
            setPadding((10 * density).toInt(), (7 * density).toInt(), (10 * density).toInt(), (7 * density).toInt())
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
                setColor(Color.parseColor("#00F0FF"))
            }
            background = sendBg
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, (34 * density).toInt()).apply {
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
    // TOUCH & DRAG
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
                        try {
                            windowManager.updateViewLayout(this, layoutParams)
                        } catch (e: Exception) {}
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
                    try {
                        windowManager.updateViewLayout(this, layoutParams)
                    } catch (e: Exception) {}
                    true
                }
                else -> false
            }
        }
    }

    // =========================================================================
    // 2-STATE TRANSITIONS (MAXIMIZE & MINIMIZE)
    // =========================================================================
    fun expandToPanel() {
        isExpanded = true
        bubbleLayout.visibility = View.GONE
        panelLayout.visibility = View.VISIBLE

        layoutParams.width = panelWidth
        layoutParams.height = panelHeight
        var flags = WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        if (isClickThrough) {
            flags = flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        }
        layoutParams.flags = flags

        try {
            windowManager.updateViewLayout(this, layoutParams)
        } catch (e: Exception) {}
    }

    fun collapseToBubble() {
        isExpanded = false
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.hideSoftInputFromWindow(replyInputView.windowToken, 0)

        panelLayout.visibility = View.GONE
        bubbleLayout.visibility = View.VISIBLE

        layoutParams.width = bubbleSize
        layoutParams.height = bubbleSize
        var flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        if (isClickThrough) {
            flags = flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        }
        layoutParams.flags = flags

        snapBubbleToEdge()
    }

    private fun snapBubbleToEdge() {
        val displayMetrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        val screenWidth = displayMetrics.widthPixels
        val currentX = layoutParams.x

        val targetX = if (currentX + bubbleSize / 2 < screenWidth / 2) {
            12
        } else {
            screenWidth - bubbleSize - 12
        }

        val animator = ValueAnimator.ofInt(currentX, targetX).apply {
            duration = 280
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
    // GHOST MODE: BACKGROUND-ONLY TRANSPARENCY (0% - 100%)
    // Controls, headers, reply bar, buttons, and text remain 100% solid & readable!
    // =========================================================================
    fun setOpacity(alphaPercent: Int) {
        currentOpacityPercent = alphaPercent.coerceIn(0, 100)
        post {
            alphaPercentText.text = "${currentOpacityPercent}%"
            updateBackgroundTransparency()
        }
    }

    private fun updateBackgroundTransparency() {
        val alphaInt = ((currentOpacityPercent * 255) / 100).coerceIn(0, 255)
        val panelBg = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 12f * density
            setColor(Color.argb(alphaInt, 8, 10, 15))
            setStroke(
                (1.5f * density).toInt(),
                Color.argb(Math.max(45, alphaInt), 0, 240, 255)
            )
        }
        panelLayout.background = panelBg
    }

    // =========================================================================
    // PASS-THROUGH (CLICK-THROUGH)
    // =========================================================================
    fun setClickThrough(enabled: Boolean) {
        isClickThrough = enabled
        post {
            if (enabled) {
                layoutParams.flags = layoutParams.flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                clickThroughBtn.text = "PASS-THRU"
                clickThroughBtn.setTextColor(Color.parseColor("#F59E0B"))
                val btnBg = GradientDrawable().apply {
                    cornerRadius = 4f * density
                    setColor(Color.parseColor("#261D0C"))
                    setStroke((1f * density).toInt(), Color.parseColor("#F59E0B"))
                }
                clickThroughBtn.background = btnBg
            } else {
                layoutParams.flags = layoutParams.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
                clickThroughBtn.text = "TOUCH"
                clickThroughBtn.setTextColor(Color.parseColor("#00F0FF"))
                val btnBg = GradientDrawable().apply {
                    cornerRadius = 4f * density
                    setColor(Color.parseColor("#141923"))
                    setStroke((1f * density).toInt(), Color.parseColor("#00F0FF"))
                }
                clickThroughBtn.background = btnBg
            }
            try {
                windowManager.updateViewLayout(this, layoutParams)
            } catch (e: Exception) {}
        }
    }

    // =========================================================================
    // DYNAMIC CHAT MESSAGES & BADGE
    // =========================================================================
    fun updateChatData(channelTitle: String, messagesJson: String) {
        post {
            if (channelTitle.isNotEmpty()) {
                channelTitleView.text = channelTitle.uppercase()
            }
            try {
                messagesLayout.removeAllViews()
                val array = JSONArray(messagesJson)
                if (array.length() == 0) {
                    addSystemMessage("NO RECENT SIGNALS // P2P MESH READY")
                } else {
                    for (i in 0 until array.length()) {
                        val obj = array.getJSONObject(i)
                        val sender = obj.optString("senderTag", obj.optString("authorAlias", "Teammate"))
                        val content = obj.optString("content", "")
                        val isMe = obj.optBoolean("isMe", false)
                        addMessageCard(sender, content, isMe)
                    }
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
                setColor(if (isMe) Color.parseColor("#1E2738") else Color.parseColor("#131722"))
                setStroke((1f * density).toInt(), if (isMe) Color.parseColor("#00F0FF") else Color.parseColor("#26FFFFFF"))
            }
            background = bg
            setPadding((9 * density).toInt(), (6 * density).toInt(), (9 * density).toInt(), (6 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = if (isMe) Gravity.END else Gravity.START
                bottomMargin = (6 * density).toInt()
                marginStart = if (isMe) (36 * density).toInt() else 0
                marginEnd = if (isMe) 0 else (36 * density).toInt()
            }
            layoutParams = lp
        }

        val senderView = TextView(context).apply {
            text = sender
            setTextColor(if (isMe) Color.parseColor("#00F0FF") else Color.parseColor("#94A3B8"))
            textSize = 9.5f
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
            setTextColor(Color.parseColor("#64748B"))
            textSize = 9.5f
            gravity = Gravity.CENTER
            setPadding(0, (12 * density).toInt(), 0, (12 * density).toInt())
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
}
