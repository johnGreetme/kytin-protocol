# 🛡️ Mission Control

**Reputation is Currency.** Kytin agents earn status through proof of physics.

[![Live Dashboard](https://img.shields.io/badge/Dashboard-LIVE-00ff9d?style=for-the-badge)](https://greetdeck.io)

---

## 🖥️ Dashboard Features

Access the visual dashboard at: **https://greetdeck.io**

### `/dashboard` - Command Center

| Component | Description |
|-----------|-------------|
| **Resin Tank** | Circular gauge showing fuel remaining (Green: >30 days, Red: <7 days) |
| **Identity Card** | Displays tier badge (Ghost/Silicon/Sentinel/Sovereign) |
| **Activity Panel** | Daily spending limits and recent heartbeats |
| **Top Up Modal** | SOL → Resin swap interface |

### `/explorer` - Global Network

| Component | Description |
|-----------|-------------|
| **World Map** | Dark-mode view with glowing nodes for each active Sentinel |
| **Stats Bar** | Total nodes, Sovereign count, Sentinel count, Silicon count |
| **Node List** | Filterable by tier and city with uptime/resin details |

### `/recovery` - Lazarus Protocol

| Component | Description |
|-----------|-------------|
| **Step 1** | Connect Recovery Wallet (Phantom/Ledger) |
| **Step 2** | Enter new TPM Public Key from replacement hardware |
| **Step 3** | Confirm identity transfer (preserves Resin + Reputation) |

---

## 🏆 Agent Hierarchy

### 👻 Tier 0: Ghost

| Property | Details |
|----------|---------|
| **Status** | Unverified |
| **Risk** | Critical - No hardware binding |
| **Badge** | None |

### 💾 Tier 1: Silicon Initiate

| Property | Details |
|----------|---------|
| **Requirement** | TPM 2.0 Verified + Resin Pack Purchased |
| **Badge** | `[SILICON]` |
| **Daily Limit** | 0.1 SOL |

### 🛡️ Tier 2: Sentinel

| Property | Details |
|----------|---------|
| **Requirement** | 30 Days Uptime + Zero Policy Violations |
| **Badge** | `[SENTINEL]` |
| **Daily Limit** | 1.0 SOL |

### 👑 Tier 3: Sovereign

| Property | Details |
|----------|---------|
| **Requirement** | 90 Days Uptime + 10,000 $KYT Staked |
| **Badge** | `[SOVEREIGN]` |
| **Daily Limit** | 10.0 SOL |

---

## ⚡ Quick Access

```bash
# View the live d**Dashboard Access:** https://greetdeck.io/recovery

# Run locally
cd dashboard && npm run dev
```

---

## 🔗 Related Documentation

- [WHITEPAPER.md](./WHITEPAPER.md) - Technical specification including Lazarus Protocol
- [ROADMAP.md](./ROADMAP.md) - Development timeline
- [../bridge/SKILL.md](../bridge/SKILL.md) - OpenClaw integration guide
