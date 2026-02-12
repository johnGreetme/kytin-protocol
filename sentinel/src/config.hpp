#ifndef KYTIN_CONFIG_HPP
#define KYTIN_CONFIG_HPP

/**
 * Kytin Protocol - Sentinel Daemon Configuration
 *
 * This header contains the Solana Program ID and configuration constants
 * that link the C++ Sentinel to the on-chain "Soul" (Smart Contract).
 */

// ============================================================================
// SOLANA PROGRAM CONFIGURATION
// ============================================================================

// The Kytin Protocol Solana Program ID (Base58 encoded)
// This is the "Corporate Personhood" contract that holds Agent Identities
#define KYTIN_PROGRAM_ID "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

// Solana RPC Endpoints
#define SOLANA_DEVNET_URL "https://api.devnet.solana.com"
#define SOLANA_MAINNET_URL "https://api.mainnet-beta.solana.com"

// Default to Devnet for development
#define SOLANA_RPC_URL SOLANA_DEVNET_URL

// ============================================================================
// SENTINEL DAEMON CONFIGURATION
// ============================================================================

// HTTP Server Port
#define SENTINEL_PORT 18789

// Heartbeat Intervals (in seconds)
#define HEARTBEAT_INTERVAL_ECO (4 * 60 * 60) // 4 hours
#define HEARTBEAT_INTERVAL_TURBO 60          // 1 minute

// Resin Costs
#define RESIN_COST_ECO 1
#define RESIN_COST_TURBO 60

// ============================================================================
// TPM CONFIGURATION
// ============================================================================

// TPM Device Path (Linux)
#define TPM_DEVICE_PATH "/dev/tpm0"

// TPM Key Slot for Agent Identity
#define TPM_KEY_SLOT 0x81000001

// ============================================================================
// SECURITY LIMITS
// ============================================================================

// Default Daily Spending Limit (in lamports, 1 SOL = 1e9 lamports)
#define DEFAULT_DAILY_LIMIT_LAMPORTS 1000000000 // 1 SOL

// Maximum transaction size for signing
#define MAX_TRANSACTION_SIZE 1232

#endif // KYTIN_CONFIG_HPP
