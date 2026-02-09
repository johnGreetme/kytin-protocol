/**
 * Kytin Protocol - CLI Configuration
 * 
 * This file contains the Solana Program ID and configuration constants
 * for the CLI installer. It allows the CLI to check on-chain Resin balance
 * and verify Agent registration status.
 */

// The Kytin Protocol Solana Program ID (Base58 encoded)
// This is the "Corporate Personhood" contract that holds Agent Identities
export const PROGRAM_ID = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";

// Solana Cluster Configuration
export const SOLANA_DEVNET_URL = "https://api.devnet.solana.com";
export const SOLANA_MAINNET_URL = "https://api.mainnet-beta.solana.com";
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || SOLANA_DEVNET_URL;

// Sentinel Daemon Configuration
export const SENTINEL_PORT = 18789;
export const SENTINEL_HOST = "http://localhost";

// Resin Endowment Configuration
export const INITIAL_RESIN_ENDOWMENT = 22000;
export const RESIN_COST_SOL = 0.25;  // SOL cost to mint initial Resin

// Heartbeat Mode Configuration
export type HeartbeatMode = "ECO" | "TURBO";
export const DEFAULT_HEARTBEAT_MODE: HeartbeatMode = "ECO";

// Version
export const KYTIN_VERSION = "1.0.0";

// Agent Tiers
export const AGENT_TIERS = {
  GHOST: 0,      // No TPM, purely software
  SILICON: 1,    // TPM detected but not registered
  SENTINEL: 2,   // TPM registered, no Resin
  SOVEREIGN: 3,  // TPM registered with Resin
} as const;

export type AgentTier = keyof typeof AGENT_TIERS;
