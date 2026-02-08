/**
 * Kytin Protocol - Bridge Skill Handler
 * 
 * Handles skill execution with security verification and Sentinel communication.
 * All external code must pass through policy checks before execution.
 * 
 * State-Locked Protocol™ (Patent Pending)
 * Copyright (c) 2026 Kytin Protocol
 */

import { 
  PolicyEngine, 
  SkillManifest, 
  VerificationResult, 
  defaultPolicy,
  CLAWHUB_OFFICIAL_KEY 
} from './policy';

// ============================================================================
// SENTINEL CLIENT
// ============================================================================

const SENTINEL_URL = 'http://localhost:18789';

interface HeartbeatResponse {
  status: 'alive' | 'error';
  hardware_id: string;
  resin_remaining: number;
  signature: string;
  algorithm: string;
}

interface SignResponse {
  signed: boolean;
  signature: string;
  error?: string;
}

interface SentinelStatus {
  protocol: string;
  version: string;
  tpm_available: boolean;
  hardware_id: string;
  resin: {
    balance: number;
    daily_remaining: number;
  };
  clawhub: string;
}

/**
 * Client for communicating with the Sentinel daemon
 */
class SentinelClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = SENTINEL_URL) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Send heartbeat to Sentinel (consumes 1 Resin)
   */
  async heartbeat(payload: Record<string, unknown>): Promise<HeartbeatResponse> {
    const response = await fetch(`${this.baseUrl}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (response.status === 402) {
      throw new ResinDepletedError('Resin tank is empty. Visit https://clawhub.kytin.io/refill');
    }
    
    if (!response.ok) {
      throw new SentinelError(`Heartbeat failed: ${response.statusText}`);
    }
    
    return response.json() as Promise<HeartbeatResponse>;
  }
  
  /**
   * Request transaction signing from Sentinel
   */
  async sign(transaction: Record<string, unknown>): Promise<SignResponse> {
    const response = await fetch(`${this.baseUrl}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    
    if (response.status === 402) {
      throw new ResinDepletedError('Resin tank is empty');
    }
    
    if (response.status === 403) {
      throw new PolicyViolationError('Transaction exceeds policy limits');
    }
    
    if (response.status === 429) {
      throw new RateLimitError('Daily limit exceeded');
    }
    
    if (!response.ok) {
      throw new SentinelError(`Signing failed: ${response.statusText}`);
    }
    
    return response.json() as Promise<SignResponse>;
  }
  
  /**
   * Get Sentinel status
   */
  async status(): Promise<SentinelStatus> {
    const response = await fetch(`${this.baseUrl}/status`);
    
    if (!response.ok) {
      throw new SentinelError(`Status check failed: ${response.statusText}`);
    }
    
    return response.json() as Promise<SentinelStatus>;
  }
  
  /**
   * Check if Sentinel is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.status();
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class SentinelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SentinelError';
  }
}

export class ResinDepletedError extends SentinelError {
  constructor(message: string) {
    super(message);
    this.name = 'ResinDepletedError';
  }
}

export class PolicyViolationError extends SentinelError {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyViolationError';
  }
}

export class RateLimitError extends SentinelError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class UnverifiedSkillError extends Error {
  public verification: VerificationResult;
  
  constructor(message: string, verification: VerificationResult) {
    super(message);
    this.name = 'UnverifiedSkillError';
    this.verification = verification;
  }
}

// ============================================================================
// SKILL HANDLER
// ============================================================================

export interface SkillExecutionContext {
  skillId: string;
  manifest: SkillManifest;
  params: Record<string, unknown>;
  callerKey?: string;
}

export interface SkillExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  resinConsumed: number;
  hardwareSignature?: string;
}

/**
 * Main skill handler with security verification
 */
export class SkillHandler {
  private sentinel: SentinelClient;
  private policy: PolicyEngine;
  private userOwnerKey: string | null = null;
  
  constructor(policy?: PolicyEngine) {
    this.sentinel = new SentinelClient();
    this.policy = policy || defaultPolicy;
  }
  
  /**
   * Initialize handler with user's TPM-attested key
   */
  async initialize(): Promise<void> {
    // Get hardware ID from Sentinel to derive user key
    const status = await this.sentinel.status();
    this.userOwnerKey = `UserOwner:${status.hardware_id}`;
    this.policy.setUserOwnerKey(this.userOwnerKey);
    
    console.log(`[KYTIN BRIDGE] Initialized with hardware: ${status.hardware_id}`);
    console.log(`[KYTIN BRIDGE] Resin balance: ${status.resin.balance}`);
  }
  
  /**
   * Execute a skill after verification
   */
  async executeSkill(context: SkillExecutionContext): Promise<SkillExecutionResult> {
    const { skillId, manifest, params } = context;
    
    console.log(`[KYTIN BRIDGE] Verifying skill: ${manifest.name} (${skillId})`);
    
    // Step 1: Verify skill signature
    const verification = this.policy.verifySkill(manifest);
    
    if (!verification.allowed) {
      console.error(`[KYTIN BRIDGE] BLOCKED: ${verification.reason}`);
      throw new UnverifiedSkillError(
        `Skill ${manifest.name} blocked: ${verification.reason}`,
        verification
      );
    }
    
    console.log(`[KYTIN BRIDGE] Verified: ${verification.reason} (${verification.trustLevel})`);
    
    // Step 2: Check rate limits
    if (!this.policy.recordExecution(skillId)) {
      throw new RateLimitError(`Skill ${skillId} has exceeded daily execution limit`);
    }
    
    // Step 3: Send heartbeat to consume Resin and get hardware signature
    const heartbeat = await this.sentinel.heartbeat({
      skill_id: skillId,
      skill_version: manifest.version,
      params_hash: this.hashParams(params),
      timestamp: Date.now(),
    });
    
    // Step 4: Execute the skill (in a real implementation, this would sandbox execution)
    let output: unknown;
    let error: string | undefined;
    let success = true;
    
    try {
      // This is where actual skill execution would happen
      // For now, we just return a mock result
      output = {
        executed: true,
        skill: manifest.name,
        trust_level: verification.trustLevel,
        hardware_attested: true,
      };
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
    }
    
    return {
      success,
      output,
      error,
      resinConsumed: 1,
      hardwareSignature: heartbeat.signature,
    };
  }
  
  /**
   * Verify if a skill would be allowed (without executing)
   */
  verifySkill(manifest: SkillManifest): VerificationResult {
    return this.policy.verifySkill(manifest);
  }
  
  /**
   * Get current Sentinel status
   */
  async getStatus(): Promise<SentinelStatus> {
    return this.sentinel.status();
  }
  
  /**
   * Check if connected to Sentinel
   */
  async isConnected(): Promise<boolean> {
    return this.sentinel.isAvailable();
  }
  
  /**
   * Hash parameters for heartbeat (simplified)
   */
  private hashParams(params: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 32);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create and initialize a skill handler
 */
export async function createSkillHandler(): Promise<SkillHandler> {
  const handler = new SkillHandler();
  await handler.initialize();
  return handler;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  SentinelClient, 
  CLAWHUB_OFFICIAL_KEY,
  PolicyEngine,
  type SkillManifest,
  type VerificationResult,
};
