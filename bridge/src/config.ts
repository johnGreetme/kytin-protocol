/**
 * Kytin Protocol - Bridge SDK Configuration
 * 
 * This file contains the Solana Program ID and IDL for the Kytin Protocol.
 * The Program ID links the Bridge SDK to the on-chain "Soul" (Smart Contract).
 */

import { PublicKey } from '@solana/web3.js';

// The Kytin Protocol Solana Program ID
// This is the "Corporate Personhood" contract that holds Agent Identities
export const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Solana Cluster Configuration
export const CLUSTER_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Sentinel Daemon Configuration
export const SENTINEL_PORT = 18789;
export const SENTINEL_HOST = "http://localhost";
export const SENTINEL_URL = `${SENTINEL_HOST}:${SENTINEL_PORT}`;

// Resin Configuration
export const INITIAL_RESIN_ENDOWMENT = 22000;
export const RESIN_PER_HEARTBEAT_ECO = 1;
export const RESIN_PER_HEARTBEAT_TURBO = 60;

// IDL will be imported after `anchor build` generates it
// export { default as IDL } from '../../solana/target/idl/kytin_solana.json';

// Placeholder IDL definition (until build generates the real one)
export const IDL = {
  version: "0.1.0",
  name: "kytin_solana",
  instructions: [
    { name: "initializeAgent", accounts: [], args: [] },
    { name: "recoverIdentity", accounts: [], args: [] },
    { name: "signHeartbeat", accounts: [], args: [] },
  ],
  accounts: [
    { name: "AgentIdentity", type: { kind: "struct", fields: [] } }
  ]
};
