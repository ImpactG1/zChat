# Phase 1: Specifications & Implementation Plan

---

## 1. Scope & Core Objectives

zChat is a serverless, censorship-resistant chat app designed for gamers. It features an always-on-top Android overlay ("Chat Heads"), click-through mode for uninterrupted gaming, and decentralized E2EE communication over Nostr relays.

---

## 2. Milestone Deliverables

### Milestone 1: Core Foundation & Tooling (Phase 2 MVP)
* Monorepo initialization with Vite + React 19 + TypeScript.
* Capacitor 7 integration targeting Android API 34+.
* Automated GitHub Actions CI workflow to build debug APKs with remote Gradle caches.
* Disk constraint enforcement: local dependencies and build caches isolated from `C:`.

### Milestone 2: Identity & Cryptographic Core
* BIP-39 mnemonic seed generation (12 words).
* Nostr secp256k1 key derivation (`privkey`, `pubkey`, `npub`).
* Gamer handle formatting (`Nickname#fingerprint`).
* NIP-44 v2 ChaCha20-Poly1305 encryption & decryption.
* NIP-59 onion Gift Wrapping and Rumor unwrapping.
* Comprehensive unit test suite with 100% crypto verification.

### Milestone 3: Messaging Engine & Storage
* Local IndexedDB storage engine via Dexie.js for conversations, message history, contacts, and outbox.
* WebSocket relay connection pool (`nostr-tools SimplePool`) with auto-reconnection and exponential backoff.
* NIP-17 1:1 direct message transmission and real-time subscription listening.
* Outbox store-and-forward queue for offline reliability.

### Milestone 4: Native Android Gaming HUD Overlay Plugin
* Custom Kotlin plugin (`zchat-overlay`) using `WindowManager`.
* Persistent Foreground Service with sticky ongoing notification.
* Chat head bubble with spring edge-snapping physics.
* Dynamic opacity slider (10% to 100%) for translucent game vision.
* Click-through mode (`FLAG_NOT_TOUCHABLE`) to pass touches through to the running game.
* Quick-reply popup window.

### Milestone 5: UI & Gamer Experience
* Cyberpunk/glassmorphism dark gaming design system with smooth micro-animations.
* Mobile-first responsive layout (fits within both standard phone screens and floating window viewports).
* Real-time relay health and ping diagnostics panel.
* Battery optimization guidance and prompt for OEM devices (MIUI, OneUI).

---

## 3. Remote CI/CD Strategy (Zero Disk Usage on `C:`)

Because the local `C:` drive has limited storage, **no local Android Studio or local Android SDK will be installed**.
All APK compilation will run on GitHub Actions using the `.github/workflows/build-apk.yml` pipeline:
1. Vite builds the web bundle (`npm run build`).
2. Capacitor copies the assets into the Android native folder (`npx cap sync android`).
3. GitHub Actions runner (`ubuntu-latest`) runs Gradle to assemble `app-debug.apk`.
4. The generated APK is uploaded as a downloadable artifact on GitHub Releases / Actions.
