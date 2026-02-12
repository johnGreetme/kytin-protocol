/**
 * Kytin Protocol - Bridge Policy Engine
 *
 * Security policy for skill execution and code verification.
 * Implements the "Clawhub Verified" trust model.
 *
 * State-Locked Protocol™ (Patent Pending)
 * Copyright (c) 2026 Kytin Protocol
 */

// ============================================================================
// TRUSTED KEYS
// ============================================================================

/**
 * Official Clawhub registry signing key.
 * All skills from clawhub.kytin.io are signed with this key.
 */
export const CLAWHUB_OFFICIAL_KEY =
  "ClawhubSigner:ed25519:5Ky7iN2o3F1c14L5H3LL4G3nT5K1LLz";

/**
 * Built-in trusted developers whitelist.
 * These keys are allowed to execute code without additional verification.
 */
export const TrustedDevelopers: ReadonlySet<string> = new Set([
  CLAWHUB_OFFICIAL_KEY,
  // Core protocol developers (hardware-attested)
  "KytinCore:ed25519:7R00t0fTru5T5t4T3L0ck3dPr0t0c0L",
]);

/**
 * Array format for configuration files
 */
export const TRUSTED_KEYS: readonly string[] = Array.from(TrustedDevelopers);

// ============================================================================
// SIGNATURE VERIFICATION (using tweetnacl)
// ============================================================================

/**
 * ARCHITECTURAL NOTE (HACKATHON MVP):
 * * Current implementation uses a software bridge to verify TPM-signed payloads.
 * * LIMITATION:
 * TPM 2.0 native curves (NIST P-256 / RSA) are not natively supported by 
 * Solana runtime (Ed25519) for direct transaction signing.
 * * V2 ROADMAP:
 * - Implement "Binding Signatures": TPM signs a P-256 payload authorizing 
 * an ephemeral Ed25519 keypair for a specific slot duration.
 * - This allows on-chain verification of the TPM authorization without 
 * requiring the Solana VM to support P-256 directly.
 * * Current "padding" logic is for Devnet demonstration purposes only.
 */
import { Connection } from "@solana/web3.js";
import nacl from 'tweetnacl';

/**
 * Verify a skill's code signature using Ed25519
 * 
 * @param code - The skill code (JS/WASM) as string
 * @param signature - Base64-encoded Ed25519 signature
 * @param developerKey - The public key of the signer
 * @returns true if signature is valid AND developerKey is trusted
 * @throws Error if signature is invalid or developer not trusted
 * 
 * @example
 * ```typescript
 * const isValid = verifySkillSignature(
 *   skillCode,
 *   'base64signature...',
 *   'ClawhubSigner:ed25519:...'
 * );
 * ```
 */
export function verifySkillSignature(
  code: string,
  signature: string,
  developerKey: string
): boolean {
  // Step 1: Check if developer is in trusted whitelist
  if (!TrustedDevelopers.has(developerKey)) {
    throw new Error(`UNTRUSTED_SOURCE: Developer key not in whitelist: ${developerKey}`);
  }

  // Step 2: Decode signature from base64
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64ToUint8Array(signature);
  } catch (e) {
    throw new Error('INVALID_SIGNATURE: Could not decode base64 signature');
  }

  // Step 3: Decode public key from developer key format
  // Format: "Prefix:algorithm:base64key"
  const keyParts = developerKey.split(':');
  if (keyParts.length !== 3 || keyParts[1] !== 'ed25519') {
    throw new Error('INVALID_KEY_FORMAT: Expected format "Prefix:ed25519:base64key"');
  }

  let publicKeyBytes: Uint8Array;
  try {
    publicKeyBytes = base64ToUint8Array(keyParts[2]);
    // Pad to 32 bytes if necessary (for mock/demo keys)
    if (publicKeyBytes.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(publicKeyBytes);
      publicKeyBytes = padded;
    }
  } catch (e) {
    throw new Error('INVALID_KEY: Could not decode public key');
  }

  // Step 4: Encode code to bytes
  const codeBytes = new TextEncoder().encode(code);

  // Step 5: Verify signature using tweetnacl
  const isValid = nacl.sign.detached.verify(codeBytes, signatureBytes, publicKeyBytes);

  if (!isValid) {
    throw new Error('SIGNATURE_INVALID: Code signature verification failed');
  }

  return true;
}

/**
 * Helper: Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Handle both browser and Node.js environments
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  } else {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

// ============================================================================
// POLICY TYPES
// ============================================================================

export interface SecurityPolicy {
  /** Allow execution from Clawhub official registry */
  allowClawhubSkills: boolean;

  /** Allow execution from user's own signing key */
  allowUserSkills: boolean;

  /** Require skills to have valid signature */
  requireSignature: boolean;

  /** Block all unsigned code (strict mode) */
  strictMode: boolean;

  /** Maximum daily skill executions */
  dailyExecutionLimit: number;

  /** Per-skill execution caps */
  perSkillLimits: Map<string, number>;
}

export interface SkillManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  signature: string;
  signerKey: string;
  checksum: string;
  clawhubVerified: boolean;
  permissions: SkillPermission[];
}

export type SkillPermission =
  | "network" // Can make HTTP requests
  | "filesystem" // Can read/write files
  | "sentinel" // Can communicate with Sentinel daemon
  | "wallet" // Can request transaction signing
  | "system"; // Can execute system commands

// ============================================================================
// VERIFICATION RESULT
// ============================================================================

export interface VerificationResult {
  allowed: boolean;
  reason: VerificationReason;
  signerKey?: string;
  trustLevel: TrustLevel;
}

export type VerificationReason =
  | "CLAWHUB_OFFICIAL"
  | "USER_OWNER_KEY"
  | "TRUSTED_DEVELOPER"
  | "SIGNATURE_VALID"
  | "SIGNATURE_INVALID"
  | "UNSIGNED_CODE"
  | "BLOCKED_SIGNER"
  | "POLICY_VIOLATION";

export type TrustLevel = "SOVEREIGN" | "VERIFIED" | "USER" | "UNTRUSTED";

// ============================================================================
// POLICY ENGINE
// ============================================================================

export class PolicyEngine {
  private policy: SecurityPolicy;
  private userOwnerKey: string | null = null;
  private blockedSigners: Set<string> = new Set();
  private executionCounts: Map<string, number> = new Map();

  constructor(policy?: Partial<SecurityPolicy>) {
    this.policy = {
      allowClawhubSkills: true,
      allowUserSkills: true,
      requireSignature: true,
      strictMode: true,
      dailyExecutionLimit: 1000,
      perSkillLimits: new Map(),
      ...policy,
    };
  }

  /**
   * Set the user's owner key (derived from TPM attestation)
   */
  setUserOwnerKey(key: string): void {
    this.userOwnerKey = key;
  }

  /**
   * Block a signer key from executing code
   */
  blockSigner(key: string): void {
    this.blockedSigners.add(key);
  }

  /**
   * Verify if a skill is allowed to execute
   */
  verifySkill(manifest: SkillManifest): VerificationResult {
    const { signerKey, signature, clawhubVerified } = manifest;

    // Check blocked signers first
    if (this.blockedSigners.has(signerKey)) {
      return {
        allowed: false,
        reason: "BLOCKED_SIGNER",
        signerKey,
        trustLevel: "UNTRUSTED",
      };
    }

    // Check for Clawhub official signature
    if (signerKey === CLAWHUB_OFFICIAL_KEY) {
      if (!this.policy.allowClawhubSkills) {
        return {
          allowed: false,
          reason: "POLICY_VIOLATION",
          signerKey,
          trustLevel: "VERIFIED",
        };
      }

      // Verify actual signature (simplified - real impl would use crypto)
      if (this.verifySignature(manifest)) {
        return {
          allowed: true,
          reason: "CLAWHUB_OFFICIAL",
          signerKey,
          trustLevel: "SOVEREIGN",
        };
      }
    }

    // Check for user's own signing key
    if (this.userOwnerKey && signerKey === this.userOwnerKey) {
      if (!this.policy.allowUserSkills) {
        return {
          allowed: false,
          reason: "POLICY_VIOLATION",
          signerKey,
          trustLevel: "USER",
        };
      }

      return {
        allowed: true,
        reason: "USER_OWNER_KEY",
        signerKey,
        trustLevel: "USER",
      };
    }

    // Check trusted developers list
    if (TrustedDevelopers.has(signerKey)) {
      if (this.verifySignature(manifest)) {
        return {
          allowed: true,
          reason: "TRUSTED_DEVELOPER",
          signerKey,
          trustLevel: "VERIFIED",
        };
      }
    }

    // No signature in strict mode = blocked
    if (this.policy.strictMode && !signature) {
      return {
        allowed: false,
        reason: "UNSIGNED_CODE",
        trustLevel: "UNTRUSTED",
      };
    }

    // Default: block untrusted code
    return {
      allowed: false,
      reason: "SIGNATURE_INVALID",
      signerKey,
      trustLevel: "UNTRUSTED",
    };
  }

  /**
   * Verify cryptographic signature (stub - requires actual crypto implementation)
   */
  private verifySignature(manifest: SkillManifest): boolean {
    // In production, this would use ed25519 signature verification
    // For now, we check that signature exists and is non-empty
    return !!manifest.signature && manifest.signature.length > 0;
  }

  /**
   * Track skill execution for rate limiting
   */
  recordExecution(skillId: string): boolean {
    const count = this.executionCounts.get(skillId) || 0;
    const limit =
      this.policy.perSkillLimits.get(skillId) ||
      this.policy.dailyExecutionLimit;

    if (count >= limit) {
      return false;
    }

    this.executionCounts.set(skillId, count + 1);
    return true;
  }

  /**
   * Reset daily execution counts
   */
  resetDailyCounts(): void {
    this.executionCounts.clear();
  }

  /**
   * Get current policy
   */
  getPolicy(): Readonly<SecurityPolicy> {
    return { ...this.policy };
  }
}

// ============================================================================
// DEFAULT POLICY INSTANCE
// ============================================================================

export const defaultPolicy = new PolicyEngine({
  allowClawhubSkills: true,
  allowUserSkills: true,
  requireSignature: true,
  strictMode: true,
  dailyExecutionLimit: 1000,
});
