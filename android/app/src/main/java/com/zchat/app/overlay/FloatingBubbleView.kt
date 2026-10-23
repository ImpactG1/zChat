package com.zchat.app.overlay

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
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
import org.json.JSONObject

@SuppressLint("ViewConstructor")
class FloatingBubbleView(
    context: Context,
    private val windowManager: WindowManager,
    val layoutParams: WindowManager.LayoutParams,
    private val onSendMessageListener: (String) -> Unit,
    private val onSelectContactListener: (String) -> Unit,
    private val onToggleClickThroughListener: (Boolean) -> Unit,
    private val onCloseOverlayListener: () -> Unit
) : FrameLayout(context) {

    private val density = context.resources.displayMetrics.density
    private val bubbleSize = (56 * density).toInt()

    // Resizable Window Geometry (Customizable by user in real time via corner grip)
    private var customMinimizedWidth = Math.min((310 * density).toInt(), (context.resources.displayMetrics.widthPixels * 0.88f).toInt())
    private var customMinimizedHeight = Math.min((260 * density).toInt(), (context.resources.displayMetrics.heightPixels * 0.45f).toInt())

    private var customMaximizedWidth = Math.min((390 * density).toInt(), (context.resources.displayMetrics.widthPixels * 0.94f).toInt())
    private var customMaximizedHeight = Math.min((520 * density).toInt(), (context.resources.displayMetrics.heightPixels * 0.74f).toInt())

    enum class WindowMode { MINIMIZED, MAXIMIZED }

    private var isBubbleForm = false
    private var currentWindowMode = WindowMode.MINIMIZED
    private var isClickThrough = false
    private var currentOpacityPercent = 85

    // Cached data
    private var currentActivePubkey: String = ""
    private var currentActiveTag: String = "#PEER"
    private var currentContactsJson: String = "[]"

    // Bubble components (Bubble form)
    private val bubbleLayout: FrameLayout
    private val iconView: ImageView
    private val badgeView: TextView

    // Window components (Void Aesthetics / Portal UI)
    private val panelLayout: LinearLayout
    private val channelTitleView: TextView
    private val channelTagView: TextView
    private val modeToggleBtn: TextView
    private val clickThroughBtn: TextView
    private val alphaPercentText: TextView
    private val timerBadgeView: TextView
    private val chatSwitcherScrollView: HorizontalScrollView
    private val chatSwitcherLayout: LinearLayout
    private val messagesLayout: LinearLayout
    private val messagesScrollView: ScrollView
    private val replyInputView: EditText
    private val resizeGripRightView: ResizeCornerGripView
    private val resizeGripLeftView: ResizeCornerGripView

    // Drag state for header
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private val touchSlop = 10f

    // Corner Resize state
    private var resizeStartX = 0f
    private var resizeStartY = 0f
    private var resizeStartW = 0
    private var resizeStartH = 0
    private var resizeStartPosX = 0

    init {
        // Starts in Minimized window mode with FLAG_NOT_TOUCH_MODAL
        // FLAG_NOT_TOUCH_MODAL is CRITICAL: It allows touches outside the window bounds
        // to pass directly through to underlying applications and games!
        layoutParams.width = customMinimizedWidth
        layoutParams.height = customMinimizedHeight
        layoutParams.gravity = Gravity.TOP or Gravity.START
        layoutParams.x = 20
        layoutParams.y = (70 * density).toInt()
        layoutParams.alpha = 1.0f
        layoutParams.flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED

        // =====================================================================
        // 1. BUBBLE FORM (Floating Sigil Bubble when collapsed via "✕")
        // =====================================================================
        bubbleLayout = FrameLayout(context).apply {
            val bgDrawable = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                colors = intArrayOf(Color.parseColor("#050608"), Color.parseColor("#0B0D11"))
                orientation = GradientDrawable.Orientation.TL_BR
                setStroke((1.8f * density).toInt(), Color.parseColor("#44FFFFFF"))
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
            val bSize = (18 * density).toInt()
            layoutParams = LayoutParams(bSize, bSize).apply {
                gravity = Gravity.TOP or Gravity.END
            }
            val badgeBg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.WHITE)
            }
            background = badgeBg
            setTextColor(Color.BLACK)
            textSize = 9.5f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            visibility = View.GONE
        }
        bubbleLayout.addView(badgeView)
        setupBubbleTouch()
        addView(bubbleLayout, LayoutParams(bubbleSize, bubbleSize))

        // =====================================================================
        // 2. WINDOW FORM (Portal Chat UI & Void Aesthetics)
        // =====================================================================
        panelLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            elevation = 25f * density
            visibility = View.VISIBLE
        }
        updateBackgroundTransparency()

        // --- Blade Chat Header (Portal Style) ---
        val headerBar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((10 * density).toInt(), (8 * density).toInt(), (10 * density).toInt(), (8 * density).toInt())
            val headerBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = floatArrayOf(
                    8f * density, 8f * density,
                    8f * density, 8f * density,
                    0f, 0f, 0f, 0f
                )
                setColor(Color.parseColor("#050608")) // var(--void-1)
                setStroke((1f * density).toInt(), Color.parseColor("#24FFFFFF"))
            }
            background = headerBg
        }

        val headerIcon = ImageView(context).apply {
            setImageResource(com.zchat.app.R.drawable.ic_zchat_bubble)
            val iconS = (18 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(iconS, iconS).apply {
                marginEnd = (8 * density).toInt()
            }
        }
        headerBar.addView(headerIcon)

        // Title Column: Alias, #Tag, and E2EE status badge
        val titleContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val nameRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        channelTitleView = TextView(context).apply {
            text = "ZENYTH"
            setTextColor(Color.WHITE)
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
        }
        nameRow.addView(channelTitleView)

        channelTagView = TextView(context).apply {
            text = " #P2P"
            setTextColor(Color.parseColor("#8C93A0"))
            textSize = 9.5f
            typeface = Typeface.MONOSPACE
            maxLines = 1
        }
        nameRow.addView(channelTagView)
        titleContainer.addView(nameRow)

        val statusRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val statusView = TextView(context).apply {
            text = "🔒 CHACHA20-POLY1305 E2EE"
            setTextColor(Color.parseColor("#64748B"))
            textSize = 8f
            typeface = Typeface.MONOSPACE
        }
        statusRow.addView(statusView)
        titleContainer.addView(statusRow)
        headerBar.addView(titleContainer)

        // Disappearing Timer Badge (Portal Style: 24H amber/bronze pill)
        timerBadgeView = TextView(context).apply {
            text = "24H"
            setTextColor(Color.parseColor("#E5A855"))
            textSize = 8.5f
            typeface = Typeface.MONOSPACE
            val timerBg = GradientDrawable().apply {
                cornerRadius = 2f * density
                setColor(Color.parseColor("#261C10"))
                setStroke((1f * density).toInt(), Color.parseColor("#99733E"))
            }
            background = timerBg
            setPadding((5 * density).toInt(), (2 * density).toInt(), (5 * density).toInt(), (2 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (4 * density).toInt()
            }
            layoutParams = lp
        }
        headerBar.addView(timerBadgeView)

        // Ghost Mode (Transparency Slider - 0% to 100%)
        val ghostContainer = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val bg = GradientDrawable().apply {
                cornerRadius = 2f * density
                setColor(Color.parseColor("#0B0D11"))
                setStroke((1f * density).toInt(), Color.parseColor("#22FFFFFF"))
            }
            background = bg
            setPadding((4 * density).toInt(), (2 * density).toInt(), (4 * density).toInt(), (2 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (4 * density).toInt()
            }
            layoutParams = lp
        }

        val ghostLabel = TextView(context).apply {
            text = "GHOST"
            setTextColor(Color.parseColor("#8C93A0"))
            textSize = 8f
            typeface = Typeface.MONOSPACE
            setPadding(0, 0, (2 * density).toInt(), 0)
        }
        ghostContainer.addView(ghostLabel)

        val alphaSeekBar = SeekBar(context).apply {
            max = 100
            progress = currentOpacityPercent
            layoutParams = LinearLayout.LayoutParams((44 * density).toInt(), LinearLayout.LayoutParams.WRAP_CONTENT)
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
            textSize = 8f
            typeface = Typeface.MONOSPACE
        }
        ghostContainer.addView(alphaPercentText)
        headerBar.addView(ghostContainer)

        // Pass-Through Button
        clickThroughBtn = TextView(context).apply {
            text = "TOUCH"
            setTextColor(Color.parseColor("#DCDFE4"))
            textSize = 8.5f
            typeface = Typeface.MONOSPACE
            val btnBg = GradientDrawable().apply {
                cornerRadius = 2f * density
                setColor(Color.parseColor("#0B0D11"))
                setStroke((1f * density).toInt(), Color.parseColor("#2EFFFFFF"))
            }
            background = btnBg
            setPadding((5 * density).toInt(), (3 * density).toInt(), (5 * density).toInt(), (3 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (4 * density).toInt()
            }
            layoutParams = lp
            setOnClickListener {
                onToggleClickThroughListener(!isClickThrough)
            }
        }
        headerBar.addView(clickThroughBtn)

        // Mode Toggle Button (Switches between MINIMIZE and MAXIMIZE mode)
        modeToggleBtn = TextView(context).apply {
            text = "MAX"
            setTextColor(Color.WHITE)
            textSize = 8.5f
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            val minBg = GradientDrawable().apply {
                cornerRadius = 2f * density
                setColor(Color.parseColor("#0B0D11"))
                setStroke((1f * density).toInt(), Color.parseColor("#38FFFFFF"))
            }
            background = minBg
            setPadding((6 * density).toInt(), (3 * density).toInt(), (6 * density).toInt(), (3 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (4 * density).toInt()
            }
            layoutParams = lp
            setOnClickListener {
                toggleWindowMode()
            }
        }
        headerBar.addView(modeToggleBtn)

        // "✕" Button -> Converts back to Bubble Form!
        val closeBtn = TextView(context).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            textSize = 10.5f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            val closeBg = GradientDrawable().apply {
                cornerRadius = 2f * density
                setColor(Color.parseColor("#14161A"))
                setStroke((1f * density).toInt(), Color.parseColor("#33FFFFFF"))
            }
            background = closeBg
            setPadding((7 * density).toInt(), (3 * density).toInt(), (7 * density).toInt(), (3 * density).toInt())
            setOnClickListener {
                // When clicking "✕", convert back to Bubble Form
                collapseToBubble()
            }
        }
        headerBar.addView(closeBtn)

        setupPanelHeaderDrag(headerBar)
        panelLayout.addView(headerBar)

        // --- Maximized Mode: Conversation Switcher Row ---
        // Hidden in Minimized mode; visible in Maximized mode so users can switch chats
        chatSwitcherLayout = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding((8 * density).toInt(), (5 * density).toInt(), (8 * density).toInt(), (5 * density).toInt())
        }

        chatSwitcherScrollView = HorizontalScrollView(context).apply {
            isHorizontalScrollBarEnabled = false
            setBackgroundColor(Color.parseColor("#050608"))
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            layoutParams = lp
            addView(chatSwitcherLayout)
            visibility = View.GONE // Hidden in Minimized mode
        }
        panelLayout.addView(chatSwitcherScrollView)

        // --- Live Messages Stream (Portal Style) ---
        messagesLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((8 * density).toInt(), (6 * density).toInt(), (8 * density).toInt(), (6 * density).toInt())
        }

        messagesScrollView = ScrollView(context).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
            setBackgroundColor(Color.TRANSPARENT)
            addView(messagesLayout)
        }
        panelLayout.addView(messagesScrollView)

        addSystemMessage("NO TRANSMISSIONS YET // ENCRYPTED P2P ACTIVE")

        // --- Input Area (Portal BladeInput + Solid Chrome Button) ---
        val replyBar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((8 * density).toInt(), (6 * density).toInt(), (8 * density).toInt(), (6 * density).toInt())
            val replyBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = floatArrayOf(
                    0f, 0f, 0f, 0f,
                    8f * density, 8f * density,
                    8f * density, 8f * density
                )
                setColor(Color.parseColor("#050608")) // var(--void-1)
                setStroke((1f * density).toInt(), Color.parseColor("#22FFFFFF"))
            }
            background = replyBg
        }

        replyInputView = EditText(context).apply {
            hint = "Whisper..."
            setHintTextColor(Color.parseColor("#555B66"))
            setTextColor(Color.WHITE)
            textSize = 12.5f
            val inputBg = GradientDrawable().apply {
                cornerRadius = 2f * density
                setColor(Color.parseColor("#000000")) // var(--void-0)
                setStroke((1f * density).toInt(), Color.parseColor("#24FFFFFF"))
            }
            background = inputBg
            setPadding((10 * density).toInt(), (6 * density).toInt(), (10 * density).toInt(), (6 * density).toInt())
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = (34 * density).toInt() // Reserve space for left corner resize grip
            }
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
                cornerRadius = 2f * density
                setColor(Color.WHITE) // Pure Chrome Button
            }
            background = sendBg
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, (32 * density).toInt()).apply {
                marginStart = (6 * density).toInt()
                marginEnd = (36 * density).toInt() // Reserve space for right corner resize grip
            }
            layoutParams = lp
            setPadding((12 * density).toInt(), 0, (12 * density).toInt(), 0)
            setOnClickListener {
                val text = replyInputView.text.toString().trim()
                if (text.isNotEmpty()) {
                    onSendMessageListener(text)
                    addMessageCard("You", "", text, isMe = true, timeStr = "")
                    replyInputView.setText("")
                }
            }
        }
        replyBar.addView(sendBtn)
        panelLayout.addView(replyBar)

        addView(panelLayout, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))

        // =====================================================================
        // 3. TACTICAL DUAL CORNER RESIZE GRIPS (Bottom-Right & Bottom-Left)
        // Enables free corner resizing on Android (height down to 100dp & width customizable!)
        // =====================================================================
        val gripS = (38 * density).toInt()
        resizeGripRightView = ResizeCornerGripView(context, isRight = true).apply {
            layoutParams = LayoutParams(gripS, gripS).apply {
                gravity = Gravity.BOTTOM or Gravity.END
            }
            elevation = 30f * density
        }
        resizeGripLeftView = ResizeCornerGripView(context, isRight = false).apply {
            layoutParams = LayoutParams(gripS, gripS).apply {
                gravity = Gravity.BOTTOM or Gravity.START
            }
            elevation = 30f * density
        }
        setupCornerResizing()
        addView(resizeGripRightView)
        addView(resizeGripLeftView)
    }

    // =========================================================================
    // DUAL CORNER RESIZE LOGIC (Height & Width fully customizable!)
    // =========================================================================
    private fun setupCornerResizing() {
        // 1. Bottom-Right Corner Grip (Drag right to widen, down to lengthen, up to minimize height)
        resizeGripRightView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    resizeStartX = event.rawX
                    resizeStartY = event.rawY
                    resizeStartW = layoutParams.width
                    resizeStartH = layoutParams.height
                    parent.requestDisallowInterceptTouchEvent(true)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dw = (event.rawX - resizeStartX).toInt()
                    val dh = (event.rawY - resizeStartY).toInt()

                    val displayMetrics = DisplayMetrics()
                    @Suppress("DEPRECATION")
                    windowManager.defaultDisplay.getMetrics(displayMetrics)
                    val screenWidth = displayMetrics.widthPixels
                    val screenHeight = displayMetrics.heightPixels

                    // Min bounds allow user to scale height down as much as they want (100dp!)
                    val minW = (180 * density).toInt()
                    val minH = (100 * density).toInt()
                    val maxW = (screenWidth - layoutParams.x).coerceAtLeast(minW)
                    val maxH = (screenHeight - layoutParams.y).coerceAtLeast(minH)

                    val newW = (resizeStartW + dw).coerceIn(minW, maxW)
                    val newH = (resizeStartH + dh).coerceIn(minH, maxH)

                    layoutParams.width = newW
                    layoutParams.height = newH

                    try {
                        windowManager.updateViewLayout(this, layoutParams)
                    } catch (e: Exception) {}
                    true
                }
                MotionEvent.ACTION_UP -> {
                    // Save user-customized size for current mode
                    if (currentWindowMode == WindowMode.MINIMIZED) {
                        customMinimizedWidth = layoutParams.width
                        customMinimizedHeight = layoutParams.height
                    } else {
                        customMaximizedWidth = layoutParams.width
                        customMaximizedHeight = layoutParams.height
                    }
                    true
                }
                else -> false
            }
        }

        // 2. Bottom-Left Corner Grip (Drag left to widen, down to lengthen, up to minimize height)
        resizeGripLeftView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    resizeStartX = event.rawX
                    resizeStartY = event.rawY
                    resizeStartW = layoutParams.width
                    resizeStartH = layoutParams.height
                    resizeStartPosX = layoutParams.x
                    parent.requestDisallowInterceptTouchEvent(true)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dw = -(event.rawX - resizeStartX).toInt()
                    val dh = (event.rawY - resizeStartY).toInt()

                    val displayMetrics = DisplayMetrics()
                    @Suppress("DEPRECATION")
                    windowManager.defaultDisplay.getMetrics(displayMetrics)
                    val screenHeight = displayMetrics.heightPixels

                    val minW = (180 * density).toInt()
                    val minH = (100 * density).toInt()
                    val maxW = (resizeStartPosX + resizeStartW).coerceAtLeast(minW)
                    val maxH = (screenHeight - layoutParams.y).coerceAtLeast(minH)

                    val newW = (resizeStartW + dw).coerceIn(minW, maxW)
                    val newH = (resizeStartH + dh).coerceIn(minH, maxH)
                    val newX = resizeStartPosX + (resizeStartW - newW)

                    layoutParams.x = newX
                    layoutParams.width = newW
                    layoutParams.height = newH

                    try {
                        windowManager.updateViewLayout(this, layoutParams)
                    } catch (e: Exception) {}
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (currentWindowMode == WindowMode.MINIMIZED) {
                        customMinimizedWidth = layoutParams.width
                        customMinimizedHeight = layoutParams.height
                    } else {
                        customMaximizedWidth = layoutParams.width
                        customMaximizedHeight = layoutParams.height
                    }
                    true
                }
                else -> false
            }
        }
    }

    // =========================================================================
    // TOUCH & DRAG FOR HEADER & BUBBLE
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
                        expandToWindow()
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
    // BUBBLE FORM <-> WINDOW FORM
    // =========================================================================
    fun expandToWindow() {
        isBubbleForm = false
        bubbleLayout.visibility = View.GONE
        panelLayout.visibility = View.VISIBLE
        resizeGripRightView.visibility = View.VISIBLE
        resizeGripLeftView.visibility = View.VISIBLE

        applyCurrentWindowDimensions()
    }

    fun collapseToBubble() {
        isBubbleForm = true
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.hideSoftInputFromWindow(replyInputView.windowToken, 0)

        panelLayout.visibility = View.GONE
        resizeGripRightView.visibility = View.GONE
        resizeGripLeftView.visibility = View.GONE
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
            duration = 240
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
    // 2 MODES: MINIMIZE <-> MAXIMIZE
    // Minimized: Scaled-down compact window, chats only
    // Maximized: Maximized window with chat switcher to switch between people
    // =========================================================================
    fun toggleWindowMode() {
        if (currentWindowMode == WindowMode.MINIMIZED) {
            setWindowMode(WindowMode.MAXIMIZED)
        } else {
            setWindowMode(WindowMode.MINIMIZED)
        }
    }

    fun setWindowMode(mode: WindowMode) {
        currentWindowMode = mode
        if (mode == WindowMode.MAXIMIZED) {
            modeToggleBtn.text = "MIN"
            chatSwitcherScrollView.visibility = View.VISIBLE
            renderChatSwitcher()
        } else {
            modeToggleBtn.text = "MAX"
            chatSwitcherScrollView.visibility = View.GONE
        }
        applyCurrentWindowDimensions()
    }

    private fun applyCurrentWindowDimensions() {
        val targetWidth = if (currentWindowMode == WindowMode.MAXIMIZED) customMaximizedWidth else customMinimizedWidth
        val targetHeight = if (currentWindowMode == WindowMode.MAXIMIZED) customMaximizedHeight else customMinimizedHeight

        layoutParams.width = targetWidth
        layoutParams.height = targetHeight

        val panelLp = panelLayout.layoutParams
        panelLp.width = targetWidth
        panelLp.height = targetHeight
        panelLayout.layoutParams = panelLp

        // CRITICAL: FLAG_NOT_TOUCH_MODAL allows touches outside floating window
        // to pass through to underlying games and apps!
        var flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        if (isClickThrough) {
            flags = flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        }
        layoutParams.flags = flags

        try {
            windowManager.updateViewLayout(this, layoutParams)
        } catch (e: Exception) {}
    }

    // =========================================================================
    // CHAT SWITCHER (MAXIMIZED MODE)
    // Lets users switch chats with other people directly from the floating HUD
    // =========================================================================
    private fun renderChatSwitcher() {
        chatSwitcherLayout.removeAllViews()
        try {
            val array = JSONArray(currentContactsJson)
            for (i in 0 until array.length()) {
                val item = array.getJSONObject(i)
                val pubkey = item.optString("pubkey", "")
                val alias = item.optString("alias", "User")
                val tag = item.optString("tag", "#PEER")
                val unread = item.optInt("unreadCount", 0)
                val isSelected = (pubkey == currentActivePubkey)

                val chip = LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL
                    val chipBg = GradientDrawable().apply {
                        cornerRadius = 2f * density
                        setColor(if (isSelected) Color.WHITE else Color.parseColor("#0B0D11"))
                        setStroke((1f * density).toInt(), if (isSelected) Color.WHITE else Color.parseColor("#26FFFFFF"))
                    }
                    background = chipBg
                    setPadding((8 * density).toInt(), (4 * density).toInt(), (8 * density).toInt(), (4 * density).toInt())
                    val lp = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply {
                        marginEnd = (5 * density).toInt()
                    }
                    layoutParams = lp

                    setOnClickListener {
                        currentActivePubkey = pubkey
                        currentActiveTag = tag
                        channelTitleView.text = alias.uppercase()
                        channelTagView.text = " $tag"
                        onSelectContactListener(pubkey)
                        renderChatSwitcher()
                    }
                }

                val chipText = TextView(context).apply {
                    text = alias.uppercase()
                    setTextColor(if (isSelected) Color.BLACK else Color.parseColor("#DCDFE4"))
                    textSize = 9f
                    typeface = Typeface.MONOSPACE
                    if (isSelected) typeface = Typeface.DEFAULT_BOLD
                }
                chip.addView(chipText)

                if (unread > 0) {
                    val badge = TextView(context).apply {
                        text = if (unread > 99) "99+" else unread.toString()
                        setTextColor(if (isSelected) Color.WHITE else Color.BLACK)
                        textSize = 8f
                        typeface = Typeface.DEFAULT_BOLD
                        val bBg = GradientDrawable().apply {
                            cornerRadius = 2f * density
                            setColor(if (isSelected) Color.BLACK else Color.WHITE)
                        }
                        background = bBg
                        setPadding((3 * density).toInt(), (1 * density).toInt(), (3 * density).toInt(), (1 * density).toInt())
                        val lp = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply {
                            marginStart = (3 * density).toInt()
                        }
                        layoutParams = lp
                    }
                    chip.addView(badge)
                }

                chatSwitcherLayout.addView(chip)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // =========================================================================
    // GHOST MODE: BACKGROUND-ONLY TRANSPARENCY (0% - 100%)
    // Controls, headers, switcher, reply bar, buttons, and text remain 100% solid & readable!
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
            cornerRadius = 8f * density
            setColor(Color.argb(alphaInt, 0, 0, 0)) // var(--void-0)
            setStroke(
                (1.2f * density).toInt(),
                Color.argb(Math.max(40, alphaInt), 255, 255, 255) // Metallic chrome border
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
                    cornerRadius = 2f * density
                    setColor(Color.parseColor("#221808"))
                    setStroke((1f * density).toInt(), Color.parseColor("#F59E0B"))
                }
                clickThroughBtn.background = btnBg
            } else {
                layoutParams.flags = layoutParams.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
                clickThroughBtn.text = "TOUCH"
                clickThroughBtn.setTextColor(Color.parseColor("#DCDFE4"))
                val btnBg = GradientDrawable().apply {
                    cornerRadius = 2f * density
                    setColor(Color.parseColor("#0B0D11"))
                    setStroke((1f * density).toInt(), Color.parseColor("#2EFFFFFF"))
                }
                clickThroughBtn.background = btnBg
            }
            try {
                windowManager.updateViewLayout(this, layoutParams)
            } catch (e: Exception) {}
        }
    }

    // =========================================================================
    // DYNAMIC CHAT MESSAGES & BADGE (PORTAL MESSAGEBUBBLE STYLE)
    // =========================================================================
    fun updateChatData(channelTitle: String, messagesJson: String, activePubkey: String = "", contactsJson: String = "[]") {
        post {
            if (channelTitle.isNotEmpty()) {
                channelTitleView.text = channelTitle.uppercase()
            }
            if (activePubkey.isNotEmpty()) {
                currentActivePubkey = activePubkey
            }
            if (contactsJson.isNotEmpty() && contactsJson != "[]") {
                currentContactsJson = contactsJson
                if (currentWindowMode == WindowMode.MAXIMIZED) {
                    renderChatSwitcher()
                }
            }

            try {
                messagesLayout.removeAllViews()
                val array = JSONArray(messagesJson)
                if (array.length() == 0) {
                    addSystemMessage("NO TRANSMISSIONS YET // ENCRYPTED P2P ACTIVE")
                } else {
                    for (i in 0 until array.length()) {
                        val obj = array.getJSONObject(i)
                        val senderName = obj.optString("senderName", obj.optString("authorAlias", "User"))
                        val senderTag = obj.optString("senderTag", "")
                        val content = obj.optString("content", "")
                        val isMe = obj.optBoolean("isMe", false)
                        val timeStr = obj.optString("time", "")
                        addMessageCard(senderName, senderTag, content, isMe, timeStr)
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

    /**
     * Renders a message card adhering strictly to the Portal MessageBubble design
     */
    fun addMessageCard(senderName: String, senderTag: String, content: String, isMe: Boolean, timeStr: String) {
        val bubbleContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (6 * density).toInt()
            }
            layoutParams = lp
            gravity = if (isMe) Gravity.END else Gravity.START
        }

        // Sender Row for incoming messages (Portal Style: Alias uppercase + #Tag + Shield Lock)
        if (!isMe && senderName.isNotEmpty()) {
            val senderRow = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = (2 * density).toInt()
                    marginStart = (4 * density).toInt()
                }
                layoutParams = lp
            }

            val nameView = TextView(context).apply {
                text = senderName.uppercase()
                setTextColor(Color.parseColor("#DCDFE4")) // var(--text-silver)
                textSize = 10f
                typeface = Typeface.DEFAULT_BOLD
            }
            senderRow.addView(nameView)

            if (senderTag.isNotEmpty()) {
                val tagView = TextView(context).apply {
                    text = " $senderTag"
                    setTextColor(Color.parseColor("#8C93A0")) // var(--text-muted)
                    textSize = 9f
                    typeface = Typeface.MONOSPACE
                }
                senderRow.addView(tagView)
            }

            val lockIcon = TextView(context).apply {
                text = " 🔒"
                textSize = 8.5f
            }
            senderRow.addView(lockIcon)
            bubbleContainer.addView(senderRow)
        }

        // Tactical Message Card Body (Portal MessageBubble Style)
        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            val bg = GradientDrawable().apply {
                cornerRadius = 3f * density
                setColor(if (isMe) Color.parseColor("#12151C") else Color.parseColor("#0B0D11")) // var(--void-3) vs var(--void-2)
                setStroke(
                    (1f * density).toInt(),
                    if (isMe) Color.parseColor("#38FFFFFF") else Color.parseColor("#1EFFFFFF")
                )
            }
            background = bg
            setPadding((10 * density).toInt(), (7 * density).toInt(), (10 * density).toInt(), (6 * density).toInt())
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                maxWidth = (280 * density).toInt()
            }
            layoutParams = lp
        }

        val contentView = TextView(context).apply {
            text = content
            setTextColor(Color.WHITE)
            textSize = 13f
            setLineSpacing(2f * density, 1f)
        }
        card.addView(contentView)

        // Metadata Sub-row: Timestamp + Double Checkmark for Self (Portal Style)
        val metaRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = (3 * density).toInt()
                gravity = Gravity.END
            }
            layoutParams = lp
        }

        if (timeStr.isNotEmpty()) {
            val timeView = TextView(context).apply {
                text = timeStr
                setTextColor(Color.parseColor("#8C93A0"))
                textSize = 8.5f
                typeface = Typeface.MONOSPACE
            }
            metaRow.addView(timeView)
        }

        if (isMe) {
            val checkmarkView = TextView(context).apply {
                text = " ✓✓"
                setTextColor(Color.parseColor("#8C93A0"))
                textSize = 9f
                typeface = Typeface.MONOSPACE
            }
            metaRow.addView(checkmarkView)
        }

        card.addView(metaRow)
        bubbleContainer.addView(card)
        messagesLayout.addView(bubbleContainer)

        messagesScrollView.post {
            messagesScrollView.fullScroll(ScrollView.FOCUS_DOWN)
        }
    }

    private fun addSystemMessage(content: String) {
        val tv = TextView(context).apply {
            text = content
            setTextColor(Color.parseColor("#555B66"))
            textSize = 9f
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

    // =========================================================================
    // CUSTOM VIEW FOR CORNER RESIZE GRIP
    // Renders tactical metallic diagonal grip lines at bottom-right or bottom-left corner
    // =========================================================================
    class ResizeCornerGripView(context: Context, private val isRight: Boolean = true) : View(context) {
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#99FFFFFF")
            strokeWidth = 1.8f * resources.displayMetrics.density
            strokeCap = Paint.Cap.ROUND
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val w = width.toFloat()
            val h = height.toFloat()
            val d = resources.displayMetrics.density

            if (isRight) {
                // Two diagonal grip lines matching BladeInput / FloatingOverlayHUD (bottom-right)
                canvas.drawLine(w - (6 * d), h - (16 * d), w - (16 * d), h - (6 * d), paint)
                canvas.drawLine(w - (6 * d), h - (9 * d), w - (9 * d), h - (6 * d), paint)
            } else {
                // Two diagonal grip lines (bottom-left)
                canvas.drawLine((6 * d), h - (16 * d), (16 * d), h - (6 * d), paint)
                canvas.drawLine((6 * d), h - (9 * d), (9 * d), h - (6 * d), paint)
            }
        }
    }
}
