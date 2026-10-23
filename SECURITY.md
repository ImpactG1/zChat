# Security Policy & Threat Model 🛡️

## Supported Versions

We actively maintain and provide cryptographic and security updates for the following versions:

| Version | Supported          | Status |
| :--- | :--- | :--- |
| `1.0.x-beta` | :white_check_mark: | Active Development |
| `< 1.0.0` | :x: | Deprecated |

---

## 🔐 Reporting a Vulnerability

The Zenyth team takes cryptographic implementation flaws and system vulnerabilities seriously. If you discover an issue related to:
- Key derivation or entropy generation
- NIP-44 v2 cipher implementation (ChaCha20-Poly1305 / HKDF / padding leaks)
- NIP-59 Gift Wrapping or metadata leakage
- WebRTC direct peer signaling interception
- Android `WindowManager` or Electron sandbox bypasses

### How to Report
Please **DO NOT** open a public GitHub issue for security-sensitive bugs.

Instead, please submit your vulnerability report through one of the following channels:
1. **GitHub Private Vulnerability Reporting**: Use the **Security** tab on the repository and select **"Report a vulnerability"**.
2. **Security Advisories**: Coordinate directly with repository maintainers (`ImpactG1`).

### What to Include
- Detailed description of the vulnerability and attack vector
- Proof of Concept (PoC) code or step-by-step reproduction instructions
- Potential impact and threat severity assessment
- Any suggested remediation or patch

We will acknowledge receipt within 48 hours and work with you on responsible disclosure.

---

## 🛡️ Threat Model & Cryptographic Guarantees

### 1. Untrusted Relay Network Assumption
- All Nostr WebSocket relays are assumed to be potentially malicious, compromised, or monitored by network adversaries (ISPs / state actors).
- **Defense**: Messages are sealed using NIP-59 Gift Wrapping. Relays only receive a `Kind: 1059` wrapper addressed to an ephemeral public key with random timestamps. Relays cannot inspect sender identity, message content, or conversation graphs.

### 2. Forward Secrecy & Key Ratcheting
- Group chats and private communications employ key ratcheting.
- **Defense**: In groups, Epoch keys rotate regularly. Compromise of an active session key does not reveal past communications.

### 3. In-Game Overlay Sandbox
- The overlay HUD runs as a borderless window on desktop (Electron) and a `SYSTEM_ALERT_WINDOW` foreground service on Android.
- **Defense**: The overlay never injects code, hooks into game memory (`DirectX`/`OpenGL`/`Vulkan`), or modifies anti-cheat processes (`Vanguard`, `Easy Anti-Cheat`, `BattlEye`). It operates strictly as an independent OS window layer, preventing anti-cheat false positives.

### 4. Memory Sanitization
- Ephemeral Diffie-Hellman secrets and private keys in memory are kept isolated within the Web Crypto / IndexedDB KeyVault layer.
- Exported keys require explicit user authentication via the 12-word recovery seed phrase.
