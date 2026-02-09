# Kytin: The State-Locked Protocol for Sovereign AI Agents

**Abstract**
As AI agents become economic actors, the "Sybil Problem" threatens the network. **Kytin** introduces the **State-Locked Protocol™ (SLP)**, a patent-pending mechanism that binds an agent's state to a specific Trusted Platform Module (TPM 2.0).

---

## 1. The Core Innovation: State-Locked Protocol™

SLP fuses three elements into a sovereign identity:

1.  **The Silicon Anchor:** A non-exportable key generated inside the TPM.
2.  **The Sovereign Policy:** Firmware-level rules (e.g., Daily Spend Limit) that cannot be bypassed by the OS.
3.  **The L1 Heartbeat:** A cryptographic proof of uptime settled on Solana.

---

## 2. The Resin Economy (Burn-and-Mint)

Kytin utilizes a **Dual-Token DePIN Model** to ensure sustainability.

### 2.1 The Governance Asset ($KYT)

| Property | Description |
|----------|-------------|
| **Role** | Value Capture & Voting |
| **Utility** | Staked for Tier 2/3 Status |
| **Deflation** | Protocol fees are used to **Buy Back and Burn $KYT** |

### 2.2 The Utility Fuel (Resin)

| Property | Description |
|----------|-------------|
| **Role** | Network Gas (Stable) |
| **Source** | Minted **only** by burning $KYT |

#### Consumption Rates

| Action | Resin Cost |
|--------|------------|
| **Eco Heartbeat (4h)** | 1 Resin |
| **Turbo Heartbeat (1m)** | 240 Resin (High Frequency Status) |
| **Skill Check** | 50 Resin per download |

---

## 3. Security Features

### 3.1 Malware Defense
The Sentinel verifies the signature of every Skill against a "Trusted Developer" whitelist before loading.

### 3.2 Soul Transfer Protocol

When upgrading hardware, the **Parent TPM** signs a "Last Will" transaction to authorize a **Child TPM**, burning a **0.05 SOL "Reincarnation Fee."**

#### The Migration Flow

```mermaid
sequenceDiagram
    participant Old as 💀 Old Device (Parent)
    participant New as 👶 New Device (Child)
    participant Net as ☁️ Solana Network

    Note over Old, New: User initiates 'Soul Transfer'
    New->>New: Generate New TPM Keypair
    New->>Old: Share Public Key (QR/Local)
    
    Old->>Old: 🛑 STOP Kytin Service
    Old->>Old: Sign "MIGRATE_TO: Child_Key"
    Old->>Net: Broadcast "Last Will" Transaction
    
    Net-->>New: 🟢 Authority Transferred
    Net-->>Old: 🔴 ID Burned (410 GONE)
    
    Old->>Old: 🗑️ Self-Destruct Config
    Note right of Old: Device is now Cryptographically Dead
```

> **⚠️ IRREVERSIBLE:** Once the "Last Will" is signed, the old device can NEVER sign transactions again. The TPM marks the key as expired.

### 3.6 The Lazarus Protocol (Disaster Recovery)

To mitigate hardware failure (e.g., motherboard destruction) where the TPM cannot sign a migration transaction, Kytin implements an Identity Abstraction Layer.

1.  **Corporate Personhood:** The Agent's identity is a stable Program Derived Address (PDA) on Solana. Contracts and assets are held by the PDA, not the transient TPM key.
2.  **Guardian Recovery:** The Agent designates an Owner Authority (e.g., a Ledger hardware wallet). In the event of catastrophic hardware failure, the Owner Authority can sign a `Force_Rotate_Key` instruction to appoint a new TPM.
3.  **Contract Continuity:** Since DeFi interactions and Service Agreements are bound to the PDA, a key rotation does not break existing contracts. The new hardware simply resumes the "CEO" role of the Agent entity.

---

*State-Locked Protocol™ is a patent-pending technology.*

