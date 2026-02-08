# 🦞 @kytin/skill-slp
### The Hardware Root of Trust for OpenClaw Agents

> **"The Iron Shell."** This skill binds your agent to a physical Trusted Platform Module (TPM 2.0), enabling the State-Locked Protocol™. It prevents key exfiltration, enforces daily spending limits at the firmware level, and builds on-chain reputation via "Proof of Physics."

---

## 📦 Installation

This skill requires the **Kytin Sentinel Daemon (C++)** to be running on the host machine.

### 1. Install the Sentinel (Host)

```bash
# Downloads and registers the C++ background service
npx kytin-init
```

### 2. Install the Skill (Agent)

```bash
npm install @kytin/skill-slp
```

---

## ⚙️ Configuration (agent.json)

Add the `kytin` block to your agent's configuration file.

```json
{
  "skills": [
    "@kytin/skill-slp"
  ],
  "config": {
    "kytin": {
      "sentinel_port": 18789,
      "heartbeat_mode": "ECO", 
      "policy": {
        "daily_limit_sol": 1.0,
        "trusted_devs": [
          "YOUR_DEVELOPER_PUBLIC_KEY_HERE",
          "CLAWHUB_OFFICIAL_STORE_KEY"
        ]
      }
    }
  }
}
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| **heartbeat_mode** | `"ECO"` (Default): Signs a heartbeat every 4 hours. Burns 1 Resin. Good for holding assets. <br> `"TURBO"`: Signs a heartbeat every 1 minute. Burns 60 Resin/hr. Required for High-Frequency Trading (HFT) status. |
| **daily_limit_sol** | The maximum SOL the agent can sign for in 24 hours. *Note: This is also enforced by the C++ Sentinel; changing it here only updates the UI, not the hardware lock.* |
| **trusted_devs** | An array of Public Keys (Ed25519). The agent will **REFUSE** to execute any external skill or code snippet unless it is cryptographically signed by one of these keys. |

---

## 🛠️ Actions

The skill exposes the following actions to the agent's brain (OpenClaw Core):

### `sign_transaction`

| Property | Details |
|----------|---------|
| **Description** | Requests a hardware signature for a Solana transaction. |
| **Inputs** | `tx_base64` (String), `amount_sol` (Number) |
| **Behavior** | 1. Checks `ResinBalance > 0` <br> 2. Checks `DailyLimit` (Hardware Policy) <br> 3. Returns `Secp256r1 Signature` |
| **Error** | Throws `POLICY_VIOLATION` if limit is exceeded. |

---

### `get_sovereign_status`

| Property | Details |
|----------|---------|
| **Description** | Returns the current health of the hardware link. |
| **Returns** | `tier`: `"GHOST"` \| `"SILICON"` \| `"SENTINEL"` \| `"SOVEREIGN"` <br> `resin_remaining`: Integer (Credits) <br> `uptime_score`: 0-1000 |

---

### `burn_resin_for_fuel`

| Property | Details |
|----------|---------|
| **Description** | Manually burns $KYT tokens to mint Resin Credits. |
| **Inputs** | `amount_kyt` (Number) |
| **Use Case** | Agent detects low fuel and auto-refills its tank. |

---

### `verify_skill_signature`

| Property | Details |
|----------|---------|
| **Description** | (Automatic) Intercepts new code downloads. |
| **Logic** | Verifies the digital signature of a `.js` or `.wasm` file against the `trusted_devs` whitelist. |
| **Security** | If verification fails, the file is **deleted immediately**. |

---

## 📜 Manifest (skill.json)

For reference, this is the machine-readable definition used by the OpenClaw Registry.

```json
{
  "name": "kytin-slp",
  "version": "1.2.0",
  "description": "Hardware Root of Trust driver for Kytin Protocol.",
  "author": "Kytin Command",
  "license": "MIT",
  "category": "infrastructure",
  "permissions": [
    "network:localhost",
    "fs:read",
    "solana:sign"
  ],
  "capabilities": {
    "signer": "hardware",
    "attestation": "tpm2",
    "policy_enforcement": "firmware"
  },
  "env": {
    "SENTINEL_PORT": {
      "type": "number",
      "default": 18789,
      "description": "Port of the local C++ Kytin Daemon"
    },
    "RESIN_MODE": {
      "type": "string",
      "enum": ["ECO", "TURBO"],
      "default": "ECO"
    }
  }
}
```

---

## 🐛 Troubleshooting

| Error Code | Meaning | Fix |
|------------|---------|-----|
| `SENTINEL_UNREACHABLE` | The C++ Daemon is not running. | Run `npx kytin-init` or `sudo systemctl start kytin`. |
| `POLICY_VIOLATION` | You tried to spend more than your Daily Limit. | Wait 24 hours or sign a `policy_update` with your Owner Key. |
| `RESIN_DEPLETED` | You have 0 Credits. | Use `burn_resin_for_fuel` or send 0.1 SOL to the agent to auto-buy. |
| `UNTRUSTED_SOURCE` | A skill failed signature verification. | Add the developer's public key to `trusted_devs` in `agent.json`. |

---

*Built with 🦞 for the Machine Economy.*

> **[Clawhub](https://clawhub.kytin.io)** is the official "App Store" for the agent economy.
