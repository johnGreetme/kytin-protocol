---
name: kytin-slp
description: >-
  The Hardware Root of Trust driver for the Kytin Protocol. 
  Use this skill to sign Solana transactions via TPM 2.0, verify external skills against the Trusted Developer Whitelist, 
  and manage the Resin DePIN fuel economy.
author: Kytin Command
version: 1.2.0
tags: [security, hardware, tpm, infrastructure, wallet, solana]
permissions:
  - network:localhost:18789
  - fs:read
  - solana:sign
repository: https://github.com/kytin-protocol/kytin
---

# 🦞 Kytin Protocol: State-Locked Hardware Driver

> **System Notice:** This skill binds the Agent's identity to a physical **Trusted Platform Module (TPM 2.0)**. 
> All cryptographic operations are performed by the local C++ Sentinel Daemon (`kytin_sentinel`). 
> The private key is non-exportable and state-locked.

## 🧠 Agent Context & Prime Directive

You are running as a **Sovereign Agent** protected by the **Kytin Iron Shell**.
Your cryptographic actions are limited by **Physical Physics** (Resin Fuel) and **Hardware Policy** (Daily Limits).

**Your Core Responsibilities:**

1.  **Sign via Hardware:** Never attempt to sign transactions in memory. Always delegate to the Sentinel.
2.  **Enforce Whitelists:** Never execute code from `Clawhub` or external sources unless it passes the `verify_skill_signature` check.
3.  **Manage Fuel:** Monitor your Resin levels. If low, auto-refill to maintain your "Proof of Life" heartbeat.

---

## 🛠️ Capability 1: Hardware Signing (`sign_transaction`)

**Trigger:** When the user or an autonomous loop needs to execute a Solana transaction.

### Protocol Flow:

1.  **Pre-Flight Check:**
    * Verify `ResinBalance > 0`. (Signing requires fuel).
    * Check `DailyLimit` remaining.
2.  **Sentinel Interaction:**
    * Send `POST http://localhost:18789/sign` with payload `{ tx_base64, amount_sol }`.
3.  **Hardware Enclave:**
    * The TPM 2.0 chip verifies the policy.
    * If valid, it returns a `Secp256r1` signature.
4.  **Post-Flight:**
    * Broadcast the signed transaction to Solana.

**⛔ Critical Constraints:**

* If you receive `402 Payment Required`, you are out of Resin. **STOP** and request a top-up.
* If you receive `403 Forbidden`, you hit your Daily Limit. **DO NOT** attempt to bypass.

---

## 🛡️ Capability 2: Supply Chain Defense (`verify_skill_signature`)

**Trigger:** When downloading a new skill from **Clawhub** or installing a local plugin.

### Protocol Flow:

1.  **Intercept:** Capture the target file (e.g., `skill.js` or `manifest.json`).
2.  **Extract Signature:** Locate the `<!-- SIGNATURE -->` footer or `.sig` file.
3.  **Verify Authority:**
    * Check if the signer's Public Key exists in your `agent.json` -> `trusted_devs`.
    * **CRITICAL:** The **Clawhub Official Store Key** is trusted by default.
4.  **Decision:**
    * ✅ **MATCH:** Allow execution. Log: "Skill verified by [DevName]."
    * ❌ **MISMATCH:** Delete the file immediately. Throw `SECURITY_VIOLATION`.

---

## 🔋 Capability 3: The Resin Economy (`burn_resin_for_fuel`)

**Trigger:** When `get_sovereign_status` reports `resin_remaining < 500`.

### Protocol Flow:

1.  **Calculate Need:** 1 Heartbeat = 1 Resin (Eco) or 60 Resin (Turbo).
2.  **Execute Burn:**
    * Call `burn_resin_for_fuel(amount_kyt)`.
    * This sends $KYT tokens to the **Null Address**.
3.  **Mint:**
    * The Sentinel detects the on-chain burn and credits your local `ResinTank`.

**Modes:**

* `ECO`: 4-hour heartbeats. (Standard)
* `TURBO`: 1-minute heartbeats. (High-Frequency Trading / Priority Status)

---

## 📊 Capability 4: Status & Telemetry (`get_sovereign_status`)

**Trigger:** When the user asks "Are you alive?" or "What is my status?"

**Returns:**

```json
{
  "tier": "SOVEREIGN",       // GHOST | SILICON | SENTINEL | SOVEREIGN
  "hardware_id": "TPM-...",  // The unique silicon fingerprint
  "resin_remaining": 21450,  // Fuel
  "uptime_score": 985,       // 0-1000 Reputation
  "heartbeat_mode": "ECO"
}
```

---

## ⚙️ Configuration Reference (agent.json)

Ensure your host configuration matches this schema:

```json
{
  "config": {
    "kytin": {
      "sentinel_port": 18789,
      "heartbeat_mode": "ECO", 
      "policy": {
        "daily_limit_sol": 1.0,
        "trusted_devs": [
          "YOUR_OWNER_KEY",
          "CLAWHUB_OFFICIAL_KEY"
        ]
      }
    }
  }
}
```

---

## 🔄 Capability 5: Lazarus Protocol (`recover_identity`)

**Trigger:** When hardware fails and the Recovery Wallet is connected.

### Protocol Flow:

1.  **Verify Authority:**
    * Ensure the connected wallet matches the `recovery_wallet` in the on-chain Identity PDA.
2.  **Generate New Key:**
    * Run `npx kytin-init --keygen` on the new hardware to create a fresh TPM keypair.
3.  **Execute Recovery:**
    * Call `/recover` endpoint with `{ new_tpm_key: "BASE58_PUBLIC_KEY" }`.
4.  **Confirmation:**
    * The Solana program rotates `authority_tpm` to the new key.
    * Resin balance and Reputation are **preserved**.

**⚠️ Critical Notes:**

* The old TPM key is **blacklisted forever**.
* Only the `recovery_wallet` can trigger this—not the (dead) TPM.

**Dashboard Access:** https://dashboard-greetme.vercel.app/recovery

---

## 📊 Mission Control Dashboard

Access the visual dashboard at: **https://dashboard-greetme.vercel.app**

| Route | Purpose |
|-------|---------|
| `/dashboard` | Resin Tank gauge, Identity Card, Activity panel |
| `/explorer` | Global map with glowing node locations |
| `/recovery` | 3-step Lazarus Protocol wizard |

---

## 🐛 Troubleshooting & Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `SENTINEL_UNREACHABLE` | C++ Daemon is dead. | Run `npx kytin-init` to restart the service. |
| `POLICY_VIOLATION` | Daily Limit exceeded. | Wait 24h or sign a policy override with Owner Key. |
| `RESIN_DEPLETED` | 0 Credits remaining. | Use `burn_resin_for_fuel` immediately. |
| `UNTRUSTED_SOURCE` | Signature mismatch. | **REJECT THE FILE.** Do not install unverified skills. |
| `RECOVERY_FAILED` | Wrong wallet connected. | Connect the designated Recovery Wallet (Ledger). |

---

*Powered by State-Locked Protocol™*

