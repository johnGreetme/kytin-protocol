/*
 * Kytin Protocol - TPM 2.0 Abstraction Layer
 *
 * Hardware Root of Trust for Autonomous AI Agents
 * State-Locked Protocol™ (Patent Pending)
 *
 * Copyright (c) 2026 Kytin Protocol
 *
 * This module provides a clean abstraction over TPM 2.0 hardware.
 * When MOCK_TPM is defined, all operations are simulated.
 */

#ifndef KYTIN_TPM_HPP
#define KYTIN_TPM_HPP

#include <cstdint>
#include <optional>
#include <string>
#include <vector>

namespace kytin {

// ============================================================================
// TPM 2.0 ABSTRACTION LAYER
// ============================================================================

/**
 * @brief Hardware-backed cryptographic operations via TPM 2.0
 *
 * The TPMInterface provides the "Physical Identity" pillar of Kytin.
 * All signatures are bound to the specific hardware module.
 *
 * MOCK_TPM flag:
 *   - When defined: Bypasses tss2 libraries, simulates TPM operations
 *   - When undefined: Uses real TPM 2.0 hardware via libtss2
 */
class TPMInterface {
public:
    // TPM Key Handles (NV Index addresses)
    static constexpr uint32_t PRIMARY_KEY_HANDLE = 0x81000001;
    static constexpr uint32_t SIGNING_KEY_HANDLE = 0x81000002;

    struct Signature {
        std::vector<uint8_t> data;
        std::string algorithm;  // "Secp256r1" (ECDSA) or "RSA-2048"
        uint64_t timestamp;
    };

    struct HardwareInfo {
        std::string hardware_id;        // Unique device identifier (EK hash)
        std::string manufacturer;       // TPM manufacturer
        std::string firmware_version;   // TPM firmware version
        bool is_mock;                   // True if running in mock mode
    };

    /**
     * @brief Initialize TPM context and verify hardware presence
     * @return true if TPM 2.0 is available and initialized (or mock mode active)
     */
    bool initialize();

    /**
     * @brief Sign payload using TPM-bound key (Secp256r1/ECDSA)
     * @param payload Data to sign
     * @return Signature or nullopt if signing failed
     */
    std::optional<Signature> sign(const std::vector<uint8_t>& payload);

    /**
     * @brief Sign a transaction hash for Solana (specifically)
     * @param tx_hash 32-byte transaction hash
     * @return Base64-encoded signature string
     */
    std::optional<std::string> sign_transaction(const std::string& tx_hash);

    /**
     * @brief Get the public key for external verification
     * @return DER-encoded Secp256r1 public key (65 bytes, uncompressed)
     */
    std::vector<uint8_t> get_public_key() const;

    /**
     * @brief Check if TPM hardware is present and functional
     */
    bool is_available() const { return m_initialized; }

    /**
     * @brief Check if running in mock mode
     */
    bool is_mock_mode() const { return m_is_mock; }

    /**
     * @brief Get hardware information
     */
    HardwareInfo get_hardware_info() const;

    /**
     * @brief Get unique hardware identifier (EK hash)
     */
    std::string get_hardware_id() const { return m_hardware_id; }

    /**
     * @brief Shutdown TPM context and cleanup resources
     */
    void shutdown();

    ~TPMInterface();

private:
    bool m_initialized = false;
    bool m_is_mock = false;
    std::string m_hardware_id;
    std::string m_manufacturer;
    std::string m_firmware_version;

    // TPM context handle (platform-specific)
    // In real mode: points to ESYS_CONTEXT*
    // In mock mode: nullptr
    void* m_tpm_context = nullptr;

    // Internal helpers
    bool init_real_tpm();
    bool init_mock_tpm();
    std::string generate_mock_signature(const std::vector<uint8_t>& payload);
};

} // namespace kytin

#endif // KYTIN_TPM_HPP
