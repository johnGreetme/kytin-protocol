/**
 * Kytin Protocol - Sentinel API Client
 *
 * HTTP client for communicating with the Kytin Sentinel daemon.
 * Uses axios for robust HTTP handling with proper error codes.
 *
 * State-Locked Protocol™ (Patent Pending)
 * Copyright (c) 2026 Kytin Protocol
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { z } from "zod";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_SENTINEL_PORT = 18789;
const DEFAULT_SENTINEL_HOST = "http://localhost";

// ============================================================================
// RESPONSE SCHEMAS (Zod Validation)
// ============================================================================

const HeartbeatResponseSchema = z.object({
  status: z.enum(["signed", "error"]),
  hardware_id: z.string(),
  signature: z.string(),
  algorithm: z.string(),
  resin_remaining: z.number(),
  mode: z.enum(["ECO", "TURBO"]).optional(),
});

const SignResponseSchema = z.object({
  signed: z.boolean(),
  signature: z.string(),
  algorithm: z.string(),
  amount_sol: z.number(),
  daily_remaining_sol: z.number(),
});

const StatusResponseSchema = z.object({
  protocol: z.string(),
  version: z.string(),
  tpm: z.object({
    available: z.boolean(),
    mock_mode: z.boolean(),
    hardware_id: z.string(),
    manufacturer: z.string(),
    firmware: z.string(),
  }),
  resin: z.object({
    balance: z.number(),
    lifetime_burned: z.number(),
    daily_limit: z.number(),
    daily_remaining: z.number(),
  }),
  policy: z.object({
    daily_limit_sol: z.number(),
    daily_spent_sol: z.number(),
  }),
  clawhub: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  clawhub: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;
export type SignResponse = z.infer<typeof SignResponseSchema>;
export type StatusResponse = z.infer<typeof StatusResponseSchema>;
export type HeartbeatMode = "ECO" | "TURBO";

export interface SignTransactionRequest {
  tx: string; // Base64-encoded transaction
  amount: number; // Amount in SOL
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class KytinError extends Error {
  public code: string;
  public statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = "KytinError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ResinDepletedError extends KytinError {
  constructor(
    message: string = "Resin tank is empty. Visit https://clawhub.kytin.io/refill",
  ) {
    super(message, "RESIN_DEPLETED", 402);
    this.name = "ResinDepletedError";
  }
}

export class DailyLimitExceededError extends KytinError {
  constructor(
    message: string = "Transaction would exceed daily spending limit",
  ) {
    super(message, "DAILY_LIMIT_EXCEEDED", 403);
    this.name = "DailyLimitExceededError";
  }
}

export class PolicyViolationError extends KytinError {
  constructor(message: string = "Transaction exceeds policy limits") {
    super(message, "POLICY_VIOLATION", 403);
    this.name = "PolicyViolationError";
  }
}

export class SentinelUnavailableError extends KytinError {
  constructor(message: string = "Kytin Sentinel daemon is not running") {
    super(message, "SENTINEL_UNAVAILABLE", 0);
    this.name = "SentinelUnavailableError";
  }
}

// ============================================================================
// KYTIN CLIENT
// ============================================================================

export interface KytinClientConfig {
  host?: string;
  port?: number;
  timeout?: number;
}

/**
 * KytinClient - API client for Kytin Sentinel daemon
 *
 * @example
 * ```typescript
 * const client = new KytinClient();
 *
 * // Check status
 * const status = await client.getStatus();
 * console.log(`Resin: ${status.resin.balance}`);
 *
 * // Send heartbeat
 * const heartbeat = await client.getHeartbeat('ECO');
 * console.log(`Signature: ${heartbeat.signature}`);
 *
 * // Sign transaction
 * const signature = await client.signTx('base64encodedtx...', 0.5);
 * console.log(`Signed: ${signature.signature}`);
 * ```
 */
export class KytinClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config: KytinClientConfig = {}) {
    const host = config.host || DEFAULT_SENTINEL_HOST;
    const port = config.port || DEFAULT_SENTINEL_PORT;
    this.baseUrl = `${host}:${port}`;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Send heartbeat to Sentinel (consumes Resin)
   *
   * @param mode - 'ECO' (1 Resin/4h) or 'TURBO' (1 Resin/min)
   * @throws {ResinDepletedError} - If Resin tank is empty (402)
   * @throws {SentinelUnavailableError} - If Sentinel is not running
   */
  async getHeartbeat(mode: HeartbeatMode = "ECO"): Promise<HeartbeatResponse> {
    try {
      const response = await this.client.post("/heartbeat", { mode });
      return HeartbeatResponseSchema.parse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request transaction signing from Sentinel
   *
   * @param txBase64 - Base64-encoded Solana transaction
   * @param amountSol - Amount in SOL for policy checking
   * @throws {ResinDepletedError} - If Resin tank is empty (402)
   * @throws {DailyLimitExceededError} - If daily limit exceeded (403)
   * @throws {PolicyViolationError} - If transaction violates policy
   */
  async signTx(txBase64: string, amountSol: number): Promise<SignResponse> {
    try {
      const response = await this.client.post("/sign", {
        tx: txBase64,
        amount: amountSol,
      });
      return SignResponseSchema.parse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Sentinel status and health information
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      const response = await this.client.get("/status");
      return StatusResponseSchema.parse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if Sentinel is online and responding
   */
  async isOnline(): Promise<boolean> {
    try {
      await this.getStatus();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current Resin balance
   */
  async getResinBalance(): Promise<number> {
    const status = await this.getStatus();
    return status.resin.balance;
  }

  /**
   * Get hardware ID from TPM
   */
  async getHardwareId(): Promise<string> {
    const status = await this.getStatus();
    return status.tpm.hardware_id;
  }

  /**
   * Handle axios errors and convert to Kytin errors
   */
  private handleError(error: unknown): KytinError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        error: string;
        message: string;
      }>;

      // Connection refused = Sentinel not running
      if (axiosError.code === "ECONNREFUSED") {
        return new SentinelUnavailableError();
      }

      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      // 402 Payment Required = Resin depleted
      if (status === 402) {
        return new ResinDepletedError(data?.message);
      }

      // 403 Forbidden = Policy violation or Daily limit
      if (status === 403) {
        if (data?.error === "POLICY_VIOLATION") {
          return new DailyLimitExceededError(data.message);
        }
        return new PolicyViolationError(data?.message);
      }

      // Generic error
      return new KytinError(
        data?.message || axiosError.message,
        data?.error || "UNKNOWN_ERROR",
        status,
      );
    }

    // Non-axios error
    if (error instanceof Error) {
      return new KytinError(error.message, "INTERNAL_ERROR");
    }

    return new KytinError("Unknown error occurred", "UNKNOWN_ERROR");
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a KytinClient with default configuration
 */
export function createClient(config?: KytinClientConfig): KytinClient {
  return new KytinClient(config);
}
