# 🦞 The Kytin Protocol

### The Hardware Root of Trust for OpenClaw Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardware: TPM 2.0](https://img.shields.io/badge/Hardware-TPM%202.0-blue)](https://trustedcomputinggroup.org/)
[![Network: Solana](https://img.shields.io/badge/Network-Solana-purple)](https://solana.com/)

> **"The Iron Shell for Sovereign Agents."**

---

## 🚨 The Problem

OpenClaw agents hold private keys in memory.

- **Malware:** Can steal keys from `.env` files.
- **Sybil Attacks:** One dev can spin up 1,000 fake agents.
- **Jailbreaks:** AI can be tricked into draining wallets.

## 🛡️ The Solution: Kytin

Kytin installs a **C++ Sentinel** that talks directly to your **TPM 2.0 chip**.

1.  **State-Locked Keys:** The private key never leaves the hardware.
2.  **Policy Enforcement:** The Sentinel blocks transactions that exceed your Daily Limit.
3.  **Proof of Physics:** The agent burns **Resin** to prove it is running on unique hardware.

---

## ⚡ Quick Start

### 1. Install Kytin

```bash
npx kytin-init
```

> Detects TPM 2.0, installs the Sentinel Daemon, and registers the System Service.

### 2. Fuel the Tank (Resin) 🔋

Kytin uses a **DePIN Model**. You pay once to fuel your hardware.

| Item         | Details                                                  |
| ------------ | -------------------------------------------------------- |
| **Cost**     | ~0.25 SOL (One-time endowment)                           |
| **Received** | 22,000 Resin Credits (Enough for 10 Years of Heartbeats) |

### 3. Integrate Agent

Add this to your `agent.json`:

```json
{
  "signer": "kytin-local",
  "policy": {
    "daily_limit_sol": 1.0,
    "trusted_devs": ["YOUR_PUBLIC_KEY"]
  }
}
```

---

## 🏗️ Architecture

| Component    | Language   | Description                                 |
| ------------ | ---------- | ------------------------------------------- |
| **Sentinel** | C++        | Background daemon managing the TPM          |
| **Bridge**   | TypeScript | Connects OpenClaw to the Sentinel           |
| **Ledger**   | Solana     | Verifies hardware signatures and Resin burn |

> _Powered by State-Locked Protocol™_

---

## 📚 Documentation

- [MANIFEST.md](./MANIFEST.md) — Protocol identity and pillars
- [docs/WHITEPAPER.md](./docs/WHITEPAPER.md) — Technical deep-dive
- [docs/ROADMAP.md](./docs/ROADMAP.md) — Development roadmap
- [docs/MISSION_CONTROL.md](./docs/MISSION_CONTROL.md) — Dashboard & reputation system

---

## 🔗 Links

- **Clawhub Registry:** [clawhub.kytin.io](https://clawhub.kytin.io)
- **Mission Control:** [mission.kytin.io](https://mission.kytin.io)

---

_State-Locked Protocol™ (Patent Pending)_
