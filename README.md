# 🦞 The Kytin Protocol

<div align="center">
  <img src="docs/assets/dashboard-hero.png" alt="Kytin Mission Control" width="100%" />
  <p>
    <b>The Hardware Root of Trust for the Machine Economy.</b><br>
    <i>State-Locked Protocol™ • TPM 2.0 Identity • Resin DePIN Economy</i>
  </p>
</div>

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardware: TPM 2.0](https://img.shields.io/badge/Hardware-TPM%202.0-blue)](https://trustedcomputinggroup.org/)
[![Network: Solana](https://img.shields.io/badge/Network-Solana-purple)](https://solana.com/)

> **What if your AI agent could prove it's not a bot swarm?**
>
> Kytin is the "Blue Checkmark" for the Machine Economy. By binding agent identity to physical hardware (TPM 2.0), we solve the Sybil problem and enable a new DePIN economy fueled by "Resin" (Proof-of-Uptime).
>
> **Features:** State-Locked Private Keys, Hardware Policy Enforcement, and the "Soul Transfer" protocol for secure migration.

---

## 🚨 The Problem

OpenClaw agents hold private keys in memory.

- **Malware:** Can steal keys from `.env` files.
- **Sybil Attacks:** One dev can spin up 1,000 fake agents.
- **Jailbreaks:** AI can be tricked into draining wallets.

## 🛡️ The Solution: Kytin

Kytin installs a **C++ Sentinel** that talks directly to your **TPM 2.0 chip**.

1. **State-Locked Keys:** The private key never leaves the hardware.
2. **Policy Enforcement:** The Sentinel blocks transactions that exceed your Daily Limit.
3. **Proof of Physics:** The agent burns **Resin** to prove it is running on unique hardware.
4. **Soul Transfer:** Securely migrate agent identity between hardware with cryptographic death certificates.

---

## ⚡ Quick Start

> **Note for Hackathon Judges:** The C++ Sentinel is pre-configured in `MOCK_TPM` mode to simulate hardware on standard laptops (including Macs without TPMs). No special drivers required!

### 1. Build & Run Sentinel

```bash
cd sentinel
mkdir build && cd build
cmake .. && make -j4
./kytin_sentinel
```

### 2. Run Mission Control Dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

### 3. Test the API

```bash
# Check status
curl http://localhost:18789/status | jq

# Send heartbeat (consumes 1 Resin)
curl -X POST http://localhost:18789/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"mode":"ECO"}'

# Execute Soul Transfer (IRREVERSIBLE!)
curl -X POST http://localhost:18789/migrate \
  -H "Content-Type: application/json" \
  -d '{"child_key":"NEW_MACHINE_PUBLIC_KEY"}'
```

---

## 🔋 Resin Economy (DePIN Model)

| Item         | Details                                                  |
| ------------ | -------------------------------------------------------- |
| **Cost**     | ~0.25 SOL (One-time endowment)                           |
| **Received** | 22,000 Resin Credits (Enough for 10 Years of Heartbeats) |

---

## 🏗️ Architecture

| Component     | Language   | Description                                 |
| ------------- | ---------- | ------------------------------------------- |
| **Sentinel**  | C++        | Background daemon managing the TPM          |
| **Bridge**    | TypeScript | Connects OpenClaw to the Sentinel           |
| **Dashboard** | Next.js    | Mission Control visualization               |
| **Ledger**    | Solana     | Verifies hardware signatures and Resin burn |

```text
┌─────────────────────────────────────────────────────────────┐
│                    KYTIN PROTOCOL                           │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐   ┌───────────┐   ┌───────────────────────┐  │
│  │  OpenClaw │◄─►│  Bridge   │◄─►│  C++ Sentinel         │  │
│  │   Agent   │   │ (TS SDK)  │   │  - TPM 2.0 Interface  │  │
│  └───────────┘   └───────────┘   │  - Policy Engine      │  │
│                                   │  - Resin Tank         │  │
│                                   └───────────┬───────────┘  │
│                                               │              │
│                                   ┌───────────▼───────────┐  │
│                                   │    Hardware (TPM)     │  │
│                                   │  State-Locked Keys    │  │
│                                   └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

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

