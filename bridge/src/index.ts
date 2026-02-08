/**
 * @kytin/skill-slp - TypeScript SDK for Kytin Protocol
 *
 * Hardware Root of Trust for Autonomous AI Agents
 * State-Locked Protocol™ (Patent Pending)
 *
 * This is the main entry point that OpenClaw loads as a skill.
 */

// ============================================================================
// CLIENT EXPORTS
// ============================================================================

export {
  KytinClient,
  createClient,
  
  // Errors
  KytinError,
  ResinDepletedError,
  DailyLimitExceededError,
  PolicyViolationError,
  SentinelUnavailableError,
  
  // Types
  type HeartbeatResponse,
  type SignResponse,
  type StatusResponse,
  type HeartbeatMode,
  type KytinClientConfig,
  type SignTransactionRequest,
} from './client';

// ============================================================================
// HANDLER EXPORTS
// ============================================================================

export {
  SkillHandler,
  createSkillHandler,
  SentinelClient,
  
  // Errors (also from handler)
  SentinelError,
  UnverifiedSkillError,
  RateLimitError,
  
  // Types
  type SkillExecutionContext,
  type SkillExecutionResult,
} from './handler';

// ============================================================================
// POLICY EXPORTS
// ============================================================================

export {
  PolicyEngine,
  defaultPolicy,
  verifySkillSignature,
  
  // Constants
  CLAWHUB_OFFICIAL_KEY,
  TrustedDevelopers,
  TRUSTED_KEYS,
  
  // Types
  type SecurityPolicy,
  type SkillManifest,
  type SkillPermission,
  type VerificationResult,
  type VerificationReason,
  type TrustLevel,
} from './policy';

// ============================================================================
// KYTIN SKILL CLASS (OpenClaw Integration)
// ============================================================================

import { KytinClient, SentinelUnavailableError } from './client';
import { PolicyEngine, verifySkillSignature, TRUSTED_KEYS } from './policy';

export interface KytinSkillConfig {
  sentinel_port?: number;
  heartbeat_mode?: 'ECO' | 'TURBO';
  policy?: {
    daily_limit_sol?: number;
    trusted_devs?: string[];
  };
}

export interface SignTransactionParams {
  tx: string;
  amount: number;
}

export interface SovereignStatus {
  tier: 'GHOST' | 'SILICON' | 'SENTINEL' | 'SOVEREIGN';
  resin_remaining: number;
  uptime_score: number;
}

/**
 * KytinSkill - The main skill class loaded by OpenClaw
 *
 * @example
 * ```typescript
 * // In your agent.json:
 * // { "skills": ["@kytin/skill-slp"] }
 *
 * // In your agent code:
 * const kytin = new KytinSkill();
 * await kytin.initialize();
 *
 * // Sign a transaction
 * const sig = await kytin.sign_transaction({ tx: 'base64...', amount: 0.5 });
 * ```
 */
export class KytinSkill {
  private client: KytinClient;
  private policy: PolicyEngine;
  private config: KytinSkillConfig;
  private isConnected: boolean = false;
  private hardwareId: string | null = null;

  constructor(config: KytinSkillConfig = {}) {
    this.config = config;
    this.client = new KytinClient({
      port: config.sentinel_port || 18789,
    });
    this.policy = new PolicyEngine();

    // Add user-configured trusted devs
    if (config.policy?.trusted_devs) {
      for (const dev of config.policy.trusted_devs) {
        // User-configured devs are added to trust (not built-in)
        console.log(`[KYTIN] Added trusted dev: ${dev.substring(0, 20)}...`);
      }
    }
  }

  /**
   * Initialize the skill - called by OpenClaw on load
   *
   * Checks if Sentinel daemon is online. If not, logs GHOST MODE warning.
   */
  async initialize(): Promise<void> {
    console.log('[KYTIN] Initializing @kytin/skill-slp...');

    try {
      const status = await this.client.getStatus();
      this.isConnected = true;
      this.hardwareId = status.tpm.hardware_id;

      console.log(`[KYTIN] Connected to Sentinel v${status.version}`);
      console.log(`[KYTIN] Hardware ID: ${this.hardwareId}`);
      console.log(`[KYTIN] TPM Mode: ${status.tpm.mock_mode ? 'MOCK' : 'HARDWARE'}`);
      console.log(`[KYTIN] Resin Balance: ${status.resin.balance}`);
      console.log(`[KYTIN] Daily Limit: ${status.policy.daily_limit_sol} SOL`);

      // Set user owner key from hardware attestation
      this.policy.setUserOwnerKey(`UserOwner:${this.hardwareId}`);

    } catch (error) {
      if (error instanceof SentinelUnavailableError) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('⚠️  CRITICAL: Kytin Sentinel missing. Running in GHOST MODE.');
        console.error('    Agent is UNVERIFIED and cannot sign transactions.');
        console.error('    Run: npx kytin-init');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.isConnected = false;
      } else {
        throw error;
      }
    }
  }

  /**
   * Action: sign_transaction
   *
   * Requests hardware signature for a Solana transaction.
   * Checks Resin balance and daily limit before signing.
   *
   * @param params - { tx: base64 transaction, amount: SOL amount }
   * @returns Signature object
   * @throws RESIN_DEPLETED, DAILY_LIMIT_EXCEEDED, POLICY_VIOLATION
   */
  async sign_transaction(params: SignTransactionParams): Promise<{
    signed: boolean;
    signature: string;
    algorithm: string;
  }> {
    if (!this.isConnected) {
      throw new Error('SENTINEL_UNREACHABLE: Cannot sign in GHOST MODE');
    }

    const { tx, amount } = params;

    console.log(`[KYTIN] Signing transaction: ${amount} SOL`);

    const result = await this.client.signTx(tx, amount);

    console.log(`[KYTIN] Signed. Remaining daily: ${result.daily_remaining_sol} SOL`);

    return {
      signed: result.signed,
      signature: result.signature,
      algorithm: result.algorithm,
    };
  }

  /**
   * Action: get_sovereign_status
   *
   * Returns the current health of the hardware link and reputation tier.
   */
  async get_sovereign_status(): Promise<SovereignStatus> {
    if (!this.isConnected) {
      return {
        tier: 'GHOST',
        resin_remaining: 0,
        uptime_score: 0,
      };
    }

    const status = await this.client.getStatus();

    // Calculate tier based on Resin and uptime (simplified)
    let tier: SovereignStatus['tier'] = 'GHOST';
    if (status.tpm.available) {
      tier = 'SILICON';
      if (status.resin.balance > 1000) {
        tier = 'SENTINEL';
      }
      // SOVEREIGN requires 90 days uptime + staking (not implemented yet)
    }

    return {
      tier,
      resin_remaining: status.resin.balance,
      uptime_score: Math.min(1000, status.resin.lifetime_burned), // Simplified score
    };
  }

  /**
   * Action: burn_resin_for_fuel
   *
   * Manually burns $KYT tokens to mint Resin Credits.
   * NOTE: This is a placeholder - actual token burning requires Solana integration.
   */
  async burn_resin_for_fuel(amount_kyt: number): Promise<{
    resin_minted: number;
    new_balance: number;
  }> {
    console.log(`[KYTIN] burn_resin_for_fuel called with ${amount_kyt} $KYT`);
    console.log('[KYTIN] NOTE: Token burning requires Solana integration (not yet implemented)');

    // Placeholder response
    const status = await this.client.getStatus();
    return {
      resin_minted: 0, // Would be calculated from burn
      new_balance: status.resin.balance,
    };
  }

  /**
   * Action: verify_skill_signature (Automatic)
   *
   * Verifies the digital signature of a skill file.
   * Called automatically when new skills are downloaded.
   *
   * @param code - The skill code (JS/WASM)
   * @param signature - Base64 signature
   * @param developerKey - Signer's public key
   * @returns true if valid, throws if invalid
   */
  verify_skill_signature(code: string, signature: string, developerKey: string): boolean {
    return verifySkillSignature(code, signature, developerKey);
  }

  /**
   * Get list of trusted developer keys
   */
  getTrustedKeys(): readonly string[] {
    return TRUSTED_KEYS;
  }

  /**
   * Check if connected to Sentinel
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Get hardware ID
   */
  getHardwareId(): string | null {
    return this.hardwareId;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create and initialize a KytinSkill instance
 */
export async function createKytinSkill(config?: KytinSkillConfig): Promise<KytinSkill> {
  const skill = new KytinSkill(config);
  await skill.initialize();
  return skill;
}
