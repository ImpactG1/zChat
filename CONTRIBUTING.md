# Contributing to Zenyth (zChat) ⚔️

First off, thank you for considering contributing to **Zenyth**! It's people like you who make decentralized, private, and censorship-resistant gaming communication possible.

By contributing to this repository, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🧭 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Git Workflow & Commit Guidelines](#git-workflow--commit-guidelines)
- [Code Style & Standards](#code-style--standards)
- [Security Disclosures](#security-disclosures)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## 🛠️ How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to ensure the bug hasn't been reported already. When creating a bug report, include as much detail as possible:

1. **Title**: Clear and descriptive summary.
2. **Environment**: OS (Windows / Linux / macOS / Android), Node version, browser / Electron version.
3. **Steps to Reproduce**: Minimal step-by-step instructions.
4. **Expected vs Actual Behavior**: What you expected to happen vs what happened.
5. **Logs / Screenshots**: Console errors, network diagnostics, or screenshots without sensitive keys.

### Suggesting Enhancements

Feature requests are tracked as GitHub issues. When suggesting an enhancement:
- Clearly explain the use case (e.g. gamer HUD overlays, cryptographic extensions, protocol bridges).
- Describe the proposed solution or design prototype.
- Ensure it aligns with our core tenets: **zero-backend sovereignty, true end-to-end encryption, and razor-sharp gaming aesthetics**.

### Submitting Pull Requests

1. **Fork** the repository and clone your fork locally.
2. Create a new branch with a descriptive name:
   ```bash
   git checkout -b feat/overlay-edge-snap
   ```
3. Implement your changes, following code style guidelines and writing tests where applicable.
4. Ensure the TypeScript compiler and linting pass:
   ```bash
   npm run build
   npm test
   ```
5. Commit your changes with clear, semantic commit messages (see below).
6. Push to your fork and submit a **Pull Request** against `main`.
7. Link any related issues in the PR description.

---

## 💻 Development Setup

```bash
# Clone the repository
git clone https://github.com/ImpactG1/zChat.git
cd zChat

# Install dependencies
npm install

# Start local web development server
npm run dev

# Start with frameless Electron desktop HUD
npm run desktop:dev

# Run automated test suites
npm test
```

---

## 🌿 Git Workflow & Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature or capability
- `fix:` A bug fix
- `docs:` Documentation-only changes
- `style:` Formatting, missing semicolons, visual polish (no logic change)
- `refactor:` Code restructuring without behavioral changes
- `test:` Adding or updating tests
- `chore:` Tooling, dependency bumps, or build scripts

**Example:**
```bash
git commit -m "feat(overlay): add magnetic edge snapping for mini bubble mode"
git commit -m "fix(crypto): prevent duplicate epoch ratchet keys on reconnect"
```

---

## 📐 Code Style & Standards

- **TypeScript Strictness**: No implicit `any`. Explicitly type all state, live queries, and Nostr event wrappers.
- **Styling Architecture**: Use CSS Variables defined in `src/styles/tokens.css`. Maintain the *Obsidian Void* aesthetic (`#000000`, `#050608`, `#0c0f14`, liquid chrome `#ffffff` highlights, razor chamfers).
- **Zero Mock Fallbacks in Production**: Always wire DB tables through Dexie (`useLiveQuery`) and Nostr relays dynamically.
- **Fail-Safe UI**: Any translucent, pass-through, or overlay mode must guarantee zero lockouts with always-clickable restore handles.

---

## 🔐 Security Disclosures

If you discover a security vulnerability (such as a flaw in cryptographic gift wrapping, key derivation, or WebRTC signaling), please **DO NOT** open a public issue. 

Email maintainers or report via GitHub Security Advisories. We take cryptographic integrity with the utmost seriousness.

---

*Sharpen your blades. See you on the Dueling Grounds.* ⚔️
