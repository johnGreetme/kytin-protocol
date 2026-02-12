/*
 * Kytin Protocol - The Sentinel (C++ Daemon)
 * 
 * Hardware Root of Trust for Autonomous AI Agents
 * State-Locked Protocol™ (Patent Pending)
 * 
 * Copyright (c) 2026 Kytin Protocol
 */

#ifndef KYTIN_HPP
#define KYTIN_HPP

#include <string>
#include <cstdint>
#include <vector>
#include <optional>
#include <chrono>

namespace kytin {

// ============================================================================
// RESIN ECONOMY
// ============================================================================

/**
 * @brief The Resin Tank - Fuel for agent operations
 * 
 * Resin is minted by burning $KYT tokens (Burn-and-Mint model).
 * Each heartbeat consumes 1 Resin unit.
 */
struct ResinTank {
    uint64_t balance;           // Current Resin balance
    uint64_t lifetime_burned;   // Total Resin consumed
    uint64_t daily_limit;       // Maximum operations per day
    uint64_t daily_consumed;    // Operations consumed today
    
    std::chrono::system_clock::time_point last_reset;
    
    bool consume(uint64_t amount = 1) {
        if (balance < amount) return false;
        if (daily_consumed + amount > daily_limit) return false;
        
        balance -= amount;
        daily_consumed += amount;
        lifetime_burned += amount;
        return true;
    }
    
    void reset_daily() {
        daily_consumed = 0;
        last_reset = std::chrono::system_clock::now();
    }
    
    bool is_empty() const { return balance == 0; }
};

// ============================================================================
// TPM 2.0 INTEGRATION
// ============================================================================

/**
 * @brief Hardware-backed cryptographic operations via TPM 2.0
 * 
 * The TPMSigner provides the "Physical Identity" pillar of Kytin.
 * All signatures are bound to the specific hardware module.
 */
class TPMSigner {
public:
    // TPM Key Handles
    static constexpr uint32_t PRIMARY_KEY_HANDLE = 0x81000001;
    static constexpr uint32_t SIGNING_KEY_HANDLE = 0x81000002;
    
    struct Signature {
        std::vector<uint8_t> data;
        std::string algorithm;  // "ECDSA-P256" or "RSA-2048"
        uint64_t timestamp;
    };
    
    /**
     * @brief Initialize TPM context and verify hardware presence
     * @return true if TPM 2.0 is available and initialized
     */
    bool initialize();
    
    /**
     * @brief Sign payload using TPM-bound key
     * @param payload Data to sign
     * @return Signature or nullopt if signing failed
     */
    std::optional<Signature> sign(const std::vector<uint8_t>& payload);
    
    /**
     * @brief Get the public key for external verification
     * @return DER-encoded public key
     */
    std::vector<uint8_t> get_public_key() const;
    
    /**
     * @brief Check if TPM hardware is present and functional
     */
    bool is_available() const { return m_initialized; }
    
    /**
     * @brief Get unique hardware identifier (EK hash)
     */
    std::string get_hardware_id() const { return m_hardware_id; }
    
private:
    bool m_initialized = false;
    std::string m_hardware_id;
    // TPM context handle (platform-specific)
    void* m_tpm_context = nullptr;
};

// ============================================================================
// POLICY ENGINE
// ============================================================================

/**
 * @brief Hardware-enforced policy for agent operations
 */
class PolicyEngine {
public:
    struct Policy {
        uint64_t max_transaction_amount;    // SOL (lamports)
        uint64_t daily_spend_limit;         // SOL (lamports)
        std::vector<std::string> allowed_programs;  // Solana program IDs
        bool require_user_approval_above;   // Amount threshold for approval
    };
    
    /**
     * @brief Check if a signing request is within policy limits
     */
    bool check_limits(uint64_t amount) const;
    
    /**
     * @brief Update policy (requires TPM attestation)
     */
    bool update_policy(const Policy& new_policy);
    
    const Policy& current_policy() const { return m_policy; }
    
private:
    Policy m_policy;
    uint64_t m_daily_spent = 0;
};

// ============================================================================
// HTTP RESPONSE CODES
// ============================================================================

namespace http {
    constexpr int OK = 200;
    constexpr int BAD_REQUEST = 400;
    constexpr int PAYMENT_REQUIRED = 402;  // No Resin!
    constexpr int FORBIDDEN = 403;
    constexpr int LIMIT_EXCEEDED = 429;
}

// ============================================================================
// SENTINEL CONFIGURATION
// ============================================================================

struct SentinelConfig {
    std::string listen_host = "127.0.0.1";
    uint16_t listen_port = 18789;
    std::string solana_rpc = "https://api.mainnet-beta.solana.com";
    std::string clawhub_registry = "https://clawhub.kytin.io";
};

} // namespace kytin

#endif // KYTIN_HPP
