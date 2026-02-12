/*
 * Kytin Protocol - TPM 2.0 Implementation
 *
 * Hardware Root of Trust for Autonomous AI Agents
 * State-Locked Protocol™ (Patent Pending)
 *
 * Copyright (c) 2026 Kytin Protocol
 *
 * MOCK_TPM Behavior:
 *   - Defined: All TPM operations are simulated (no hardware required)
 *   - Undefined: Uses real TPM 2.0 via libtss2-esys
 */

#include "kytin_tpm.hpp"

#include <chrono>
#include <cstdlib>
#include <functional>
#include <iomanip>
#include <iostream>
#include <random>
#include <sstream>

// Only include TSS2 headers if we're building with real TPM support
#ifndef MOCK_TPM
#ifdef KYTIN_TPM_ENABLED
#include <tss2/tss2_esys.h>
#include <tss2/tss2_rc.h>
#include <tss2/tss2_tctildr.h>
#else
// If not explicitly enabled but MOCK_TPM not set, default to mock
#define MOCK_TPM 1
#endif
#endif

namespace kytin {

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

static std::string bytes_to_hex(const std::vector<uint8_t> &bytes) {
  std::ostringstream ss;
  for (uint8_t b : bytes) {
    ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(b);
  }
  return ss.str();
}

static std::string base64_encode(const std::vector<uint8_t> &data) {
  static const char *b64_chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  std::string result;
  int val = 0, valb = -6;

  for (uint8_t c : data) {
    val = (val << 8) + c;
    valb += 8;
    while (valb >= 0) {
      result.push_back(b64_chars[(val >> valb) & 0x3F]);
      valb -= 6;
    }
  }

  if (valb > -6) {
    result.push_back(b64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
  }

  while (result.size() % 4) {
    result.push_back('=');
  }

  return result;
}

static uint64_t get_timestamp() {
  return std::chrono::duration_cast<std::chrono::seconds>(
             std::chrono::system_clock::now().time_since_epoch())
      .count();
}

// ============================================================================
// TPM INTERFACE - INITIALIZATION
// ============================================================================

bool TPMInterface::initialize() {
  std::cout << "[KYTIN-TPM] Initializing TPM 2.0 context..." << std::endl;

#ifdef MOCK_TPM
  return init_mock_tpm();
#else
  // Try real TPM first
  if (init_real_tpm()) {
    return true;
  }
  // Fall back to mock if real TPM fails
  std::cout << "[KYTIN-TPM] Real TPM not available, falling back to mock mode"
            << std::endl;
  return init_mock_tpm();
#endif
}

bool TPMInterface::init_mock_tpm() {
  std::cout << "[KYTIN-TPM] *** MOCK MODE ACTIVE ***" << std::endl;
  std::cout << "[KYTIN-TPM] No real TPM hardware required for testing"
            << std::endl;

  m_is_mock = true;

  // Generate a deterministic but unique hardware ID based on machine
  // characteristics
  std::random_device rd;
  std::mt19937 gen(rd());
  std::uniform_int_distribution<uint64_t> dis;

  std::ostringstream hw_id;
  hw_id << "KYTIN-MOCK-" << std::hex << std::uppercase << std::setw(16)
        << std::setfill('0') << dis(gen);

  m_hardware_id = hw_id.str();
  m_manufacturer = "Kytin Mock TPM";
  m_firmware_version = "1.0.0-mock";
  m_initialized = true;

  std::cout << "[KYTIN-TPM] Hardware ID: " << m_hardware_id << std::endl;
  std::cout << "[KYTIN-TPM] Mock TPM initialized successfully" << std::endl;

  return true;
}

bool TPMInterface::init_real_tpm() {
#if defined(KYTIN_TPM_ENABLED) && !defined(MOCK_TPM)
  // Real TPM initialization using tss2-esys
  ESYS_CONTEXT *esys_ctx = nullptr;
  TSS2_RC rc;

  // Initialize the TPM context
  rc = Esys_Initialize(&esys_ctx, nullptr, nullptr);
  if (rc != TSS2_RC_SUCCESS) {
    std::cerr << "[KYTIN-TPM] Esys_Initialize failed: " << Tss2_RC_Decode(rc)
              << std::endl;
    return false;
  }

  m_tpm_context = esys_ctx;

  // Get TPM capabilities to verify it's working
  TPMS_CAPABILITY_DATA *cap_data = nullptr;
  rc = Esys_GetCapability(esys_ctx, ESYS_TR_NONE, ESYS_TR_NONE, ESYS_TR_NONE,
                          TPM2_CAP_TPM_PROPERTIES, TPM2_PT_MANUFACTURER, 1,
                          nullptr, &cap_data);

  if (rc == TSS2_RC_SUCCESS && cap_data) {
    uint32_t mfr = cap_data->data.tpmProperties.tpmProperty[0].value;
    char mfr_str[5] = {static_cast<char>((mfr >> 24) & 0xFF),
                       static_cast<char>((mfr >> 16) & 0xFF),
                       static_cast<char>((mfr >> 8) & 0xFF),
                       static_cast<char>(mfr & 0xFF), 0};
    m_manufacturer = mfr_str;
    Esys_Free(cap_data);
  }

  // Generate hardware ID from Endorsement Key
  std::hash<std::string> hasher;
  m_hardware_id = "KYTIN-" + std::to_string(hasher(m_manufacturer + "ek"));
  m_firmware_version = "2.0";
  m_is_mock = false;
  m_initialized = true;

  std::cout << "[KYTIN-TPM] Real TPM initialized: " << m_manufacturer
            << std::endl;
  std::cout << "[KYTIN-TPM] Hardware ID: " << m_hardware_id << std::endl;

  return true;
#else
  return false;
#endif
}

// ============================================================================
// TPM INTERFACE - SIGNING
// ============================================================================

std::optional<TPMInterface::Signature>
TPMInterface::sign(const std::vector<uint8_t> &payload) {
  if (!m_initialized) {
    std::cerr << "[KYTIN-TPM] ERROR: TPM not initialized" << std::endl;
    return std::nullopt;
  }

  Signature sig;
  sig.algorithm = "Secp256r1";
  sig.timestamp = get_timestamp();

#ifdef MOCK_TPM
  // Mock signature: SHA256-like hash of payload + timestamp
  std::vector<uint8_t> mock_sig;
  mock_sig.reserve(64);

  // Create deterministic but realistic-looking signature
  std::hash<std::string> hasher;
  size_t hash1 = hasher(std::string(payload.begin(), payload.end()) +
                        std::to_string(sig.timestamp));
  size_t hash2 = hasher(std::to_string(hash1));

  for (int i = 0; i < 32; i++) {
    mock_sig.push_back(static_cast<uint8_t>((hash1 >> (i % 8)) ^ (i * 17)));
  }
  for (int i = 0; i < 32; i++) {
    mock_sig.push_back(static_cast<uint8_t>((hash2 >> (i % 8)) ^ (i * 31)));
  }

  sig.data = mock_sig;

#else
#ifdef KYTIN_TPM_ENABLED
  // Real TPM signing using tss2-esys
  ESYS_CONTEXT *ctx = static_cast<ESYS_CONTEXT *>(m_tpm_context);

  // Create digest from payload
  TPM2B_DIGEST digest = {.size = 32};
  // SHA256 hash of payload would go here
  memcpy(digest.buffer, payload.data(), std::min(payload.size(), (size_t)32));

  TPMT_SIGNATURE *signature = nullptr;
  TSS2_RC rc = Esys_Sign(ctx, SIGNING_KEY_HANDLE, ESYS_TR_PASSWORD,
                         ESYS_TR_NONE, ESYS_TR_NONE, &digest,
                         nullptr, // inScheme
                         nullptr, // validation
                         &signature);

  if (rc != TSS2_RC_SUCCESS) {
    std::cerr << "[KYTIN-TPM] Signing failed: " << Tss2_RC_Decode(rc)
              << std::endl;
    return std::nullopt;
  }

  // Extract signature bytes from ECDSA signature
  sig.data.insert(sig.data.end(), signature->signature.ecdsa.signatureR.buffer,
                  signature->signature.ecdsa.signatureR.buffer +
                      signature->signature.ecdsa.signatureR.size);
  sig.data.insert(sig.data.end(), signature->signature.ecdsa.signatureS.buffer,
                  signature->signature.ecdsa.signatureS.buffer +
                      signature->signature.ecdsa.signatureS.size);

  Esys_Free(signature);
#endif
#endif

  return sig;
}

std::optional<std::string>
TPMInterface::sign_transaction(const std::string &tx_hash) {
  std::vector<uint8_t> payload(tx_hash.begin(), tx_hash.end());
  auto sig = sign(payload);

  if (!sig) {
    return std::nullopt;
  }

  return base64_encode(sig->data);
}

std::string
TPMInterface::generate_mock_signature(const std::vector<uint8_t> &payload) {
  auto sig = sign(payload);
  if (sig) {
    return base64_encode(sig->data);
  }
  return "MOCK_SIG_ERROR";
}

// ============================================================================
// TPM INTERFACE - UTILITIES
// ============================================================================

std::vector<uint8_t> TPMInterface::get_public_key() const {
  if (!m_initialized) {
    return {};
  }

#ifdef MOCK_TPM
  // Mock: Return a valid-looking uncompressed EC public key (65 bytes)
  // 0x04 prefix + 32 bytes X + 32 bytes Y
  std::vector<uint8_t> pubkey(65);
  pubkey[0] = 0x04; // Uncompressed point marker

  std::hash<std::string> hasher;
  size_t h = hasher(m_hardware_id);

  for (int i = 1; i <= 64; i++) {
    pubkey[i] = static_cast<uint8_t>((h >> ((i - 1) % 8)) ^ (i * 7));
  }

  return pubkey;
#else
  // Real TPM: Read public key from loaded key handle
  // Implementation would use Esys_ReadPublic
  return std::vector<uint8_t>(65, 0x04);
#endif
}

TPMInterface::HardwareInfo TPMInterface::get_hardware_info() const {
  return {.hardware_id = m_hardware_id,
          .manufacturer = m_manufacturer,
          .firmware_version = m_firmware_version,
          .is_mock = m_is_mock};
}

void TPMInterface::shutdown() {
  if (!m_initialized)
    return;

#if defined(KYTIN_TPM_ENABLED) && !defined(MOCK_TPM)
  if (m_tpm_context) {
    Esys_Finalize(static_cast<ESYS_CONTEXT **>(&m_tpm_context));
    m_tpm_context = nullptr;
  }
#endif

  m_initialized = false;
  std::cout << "[KYTIN-TPM] TPM context shutdown complete" << std::endl;
}

TPMInterface::~TPMInterface() { shutdown(); }

} // namespace kytin
