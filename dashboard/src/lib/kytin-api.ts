/**
 * Kytin Protocol - API Client for Mission Control Dashboard
 * 
 * Connects to local Sentinel daemon on port 18789
 */

const SENTINEL_URL = process.env.NEXT_PUBLIC_SENTINEL_URL || 'http://localhost:18789';

// ============================================================================
// TYPES
// ============================================================================

export interface TPMInfo {
  available: boolean;
  mock_mode: boolean;
  hardware_id: string;
  manufacturer: string;
  firmware: string;
}

export interface ResinInfo {
  balance: number;
  lifetime_burned: number;
  daily_limit: number;
  daily_remaining: number;
}

export interface PolicyInfo {
  daily_limit_sol: number;
  daily_spent_sol: number;
}

export interface SentinelStatus {
  protocol: string;
  version: string;
  tpm: TPMInfo;
  resin: ResinInfo;
  policy: PolicyInfo;
  clawhub: string;
}

export interface HeartbeatResponse {
  status: 'signed' | 'error';
  hardware_id: string;
  signature: string;
  algorithm: string;
  resin_remaining: number;
  mode: 'ECO' | 'TURBO';
}

export interface MigrateResponse {
  status: 'soul_transferred';
  last_will_signature: string;
  parent_pubkey: string;
  child_key: string;
  payload: string;
  algorithm: string;
  message: string;
}

export interface DeadAgentError {
  error: 'AGENT_DEAD' | 'ALREADY_DEAD';
  message: string;
  child_key: string;
  last_will_signature: string;
}

export type AgentState = 'online' | 'offline' | 'dead';

// ============================================================================
// API CLIENT
// ============================================================================

export class KytinAPI {
  private baseUrl: string;

  constructor(baseUrl: string = SENTINEL_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get Sentinel status
   */
  async getStatus(): Promise<SentinelStatus> {
    const res = await fetch(`${this.baseUrl}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 410) {
      const error = await res.json() as DeadAgentError;
      throw new AgentDeadError(error);
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch status: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Send heartbeat (consumes 1 Resin)
   */
  async heartbeat(mode: 'ECO' | 'TURBO' = 'ECO'): Promise<HeartbeatResponse> {
    const res = await fetch(`${this.baseUrl}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });

    if (res.status === 410) {
      const error = await res.json() as DeadAgentError;
      throw new AgentDeadError(error);
    }

    if (res.status === 402) {
      throw new ResinDepletedError('Resin tank is empty');
    }

    if (!res.ok) {
      throw new Error(`Heartbeat failed: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Execute Soul Transfer (IRREVERSIBLE!)
   */
  async migrate(childKey: string): Promise<MigrateResponse> {
    const res = await fetch(`${this.baseUrl}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ child_key: childKey, auth_token: 'dashboard' }),
    });

    if (res.status === 410) {
      const error = await res.json() as DeadAgentError;
      throw new AgentDeadError(error);
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Migration failed');
    }

    return res.json();
  }

  /**
   * Check if Sentinel is reachable
   */
  async isOnline(): Promise<boolean> {
    try {
      await this.getStatus();
      return true;
    } catch (e) {
      if (e instanceof AgentDeadError) {
        return true; // Dead but reachable
      }
      return false;
    }
  }

  /**
   * Get current agent state
   */
  async getAgentState(): Promise<{ state: AgentState; data?: SentinelStatus | DeadAgentError }> {
    try {
      const status = await this.getStatus();
      return { state: 'online', data: status };
    } catch (e) {
      if (e instanceof AgentDeadError) {
        return { state: 'dead', data: e.details };
      }
      return { state: 'offline' };
    }
  }
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class AgentDeadError extends Error {
  public details: DeadAgentError;

  constructor(details: DeadAgentError) {
    super(details.message);
    this.name = 'AgentDeadError';
    this.details = details;
  }
}

export class ResinDepletedError extends Error {
  constructor(message: string = 'Resin depleted') {
    super(message);
    this.name = 'ResinDepletedError';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const kytinAPI = new KytinAPI();
