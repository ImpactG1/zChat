# zChat — Serverless Censorship-Resistant Gamer HUD & Chat

> **A zero-backend, end-to-end encrypted messaging app built for gamers, featuring an always-on-top translucent HUD overlay, click-through mode, and Nostr relay-mesh transport.**

---

## ⚡ Key Highlights

- **Serverless & Censorship-Resistant:** Zero centralized servers. Runs over distributed public Nostr relays with NIP-17/NIP-44 v2/NIP-59 cryptographic privacy.
- **True End-to-End Encryption:** ChaCha20-Poly1305 authenticated payload encryption + onion-style Gift Wrapping to conceal sender/recipient metadata from relays.
- **Gamer HUD Overlay (Android):**
  - Always-on-top floating bubble (Chat Heads) via `SYSTEM_ALERT_WINDOW` & native Foreground Service.
  - **Click-Through Mode:** Pass all screen touch gestures straight through to the active game (`FLAG_NOT_TOUCHABLE`) while keeping chat visible.
  - **Dynamic Opacity / Ghost Mode:** Translucency slider from 10% to 100% so you can read team chats without obstructing game vision.
  - **Edge Snapping:** Magnetic physics docking to left/right screen borders.
  - **Quick Reply:** Send rapid replies without closing or switching out of your game.
- **Decentralized Identity:** Device-generated secp256k1 keypairs backed up with 12-word BIP-39 seed phrases. Unique handle format: `GamerTag#fingerprint` (e.g. `Viper#8f3a`).
- **Lean Toolchain:** Remote GitHub Actions APK compilation. Zero disk footprint on `C:`.

---

## 🏗️ Architecture Stack

- **UI Framework:** React 19 + TypeScript + Vite
- **Styling:** Vanilla CSS (Dark mode, glassmorphism, high-contrast gaming tokens)
- **Local Storage:** Dexie.js (IndexedDB) with encrypted key vault
- **Crypto & Nostr Core:** `nostr-tools`, `@noble/curves`, `@noble/ciphers` (NIP-17, NIP-44 v2, NIP-59)
- **Mobile Container:** Capacitor 7
- **Android Native Overlay:** Custom Kotlin plugin (`zchat-overlay`) using Android `WindowManager`
- **CI/CD:** Automated GitHub Actions debug APK build (`.github/workflows/build-apk.yml`)

---

## 🗺️ Project Roadmap

- [x] **Phase 0:** Research & Protocol Evaluation (Nostr vs Matrix vs Signal vs Tox, Overlay mechanics, Play Store & UGC analysis).
- [x] **Phase 1:** Comprehensive Architecture, Schemas, Message Flows & Project Planning.
- [ ] **Phase 2 (MVP):**
  - [ ] Identity generation + 12-word seed backup / restore
  - [ ] NIP-17 / NIP-44 v2 E2EE 1:1 chat engine over Nostr relays
  - [ ] Relay pool manager with real-time latency indicators
  - [ ] Native Android Kotlin Overlay Plugin (Chat Heads, edge snapping, quick reply)
  - [ ] Glassmorphic gaming UI with HUD opacity & click-through toggles
  - [ ] GitHub Actions APK build workflow
- [ ] **Phase 3:** Gaming Party Groups (Admin-signed key rotation / NIP-29), custom HUD themes, multi-bubble switcher.
- [ ] **Phase 4:** Offline BLE mesh transport mode & desktop frameless transparent client (Tauri/Electron).

---

## 🛠️ Development Setup

All build caches are configured to live on the `D:` drive to preserve system disk space.

```bash
# Set npm cache to D: drive
npm config set cache "D:\.npm-cache" --global

# Install dependencies
npm install

# Start local web development server
npm run dev

# Run unit tests (crypto & message wrapping)
npm test
```

---

## 📄 License

MIT License — Built for gamers, hackers, and privacy advocates.
