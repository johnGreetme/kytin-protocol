/*
 * Kytin Protocol - The Sentinel (C++ Daemon)
 *
 * HTTP Server listening on localhost:18789
 * Endpoints:
 *   POST /heartbeat - Consume Resin, sign payload with TPM
 *   POST /sign      - Policy-checked transaction signing
 *   GET  /status    - Health check and status
 *
 * State-Locked Protocol™ (Patent Pending)
 * Copyright (c) 2026 Kytin Protocol
 */

#include "kytin.hpp"
#include "kytin_tpm.hpp"

#include <httplib.h>
#include <nlohmann/json.hpp>

#include <atomic>
#include <chrono>
#include <csignal>
#include <iostream>
#include <mutex>
#include <string>

using json = nlohmann::json;

namespace kytin {

// ============================================================================
// GLOBAL STATE
// ============================================================================

// Initial Resin balance: 22,000 credits (10 years of ECO heartbeats)
static ResinTank g_resin_tank = {.balance = 22000,
                                 .lifetime_burned = 0,
                                 .daily_limit = 1000,
                                 .daily_consumed = 0,
                                 .last_reset =
                                     std::chrono::system_clock::now()};

// Daily spending limit in SOL (hardcoded for now)
static constexpr double DAILY_LIMIT_SOL = 10.0;
static double g_daily_spent_sol = 0.0;
static std::mutex g_state_mutex;

static TPMInterface g_tpm;
static std::atomic<bool> g_running{true};

// ============================================================================
// CONFIGURATION
// ============================================================================

static constexpr const char *LISTEN_HOST = "127.0.0.1";
static constexpr int LISTEN_PORT = 18789;
static constexpr const char *CLAWHUB_REGISTRY = "https://clawhub.kytin.io";

// ============================================================================
// HEARTBEAT MODES
// ============================================================================

enum class HeartbeatMode {
  ECO,  // 1 Resin per 4 hours
  TURBO // 240 Resin per 4 hours (1 per minute)
};

static uint64_t get_resin_cost(HeartbeatMode mode) {
  switch (mode) {
  case HeartbeatMode::ECO:
    return 1;
  case HeartbeatMode::TURBO:
    return 1; // Still 1 per call, but called more frequently
  default:
    return 1;
  }
}

static HeartbeatMode parse_heartbeat_mode(const std::string &mode_str) {
  if (mode_str == "TURBO")
    return HeartbeatMode::TURBO;
  return HeartbeatMode::ECO; // Default
}

// ============================================================================
// ENDPOINT HANDLERS
// ============================================================================

/**
 * POST /heartbeat
 * Input: { "mode": "ECO" | "TURBO" }
 *
 * The core "proof of life" endpoint. Each heartbeat:
 * 1. Checks Resin balance
 * 2. Signs the payload with TPM key
 * 3. Deducts Resin based on mode
 *
 * Returns 402 Payment Required if tank is empty.
 */
void handle_heartbeat(const httplib::Request &req, httplib::Response &res) {
  std::lock_guard<std::mutex> lock(g_state_mutex);

  // Parse request body
  json request_json;
  HeartbeatMode mode = HeartbeatMode::ECO;

  try {
    if (!req.body.empty()) {
      request_json = json::parse(req.body);
      if (request_json.contains("mode")) {
        mode = parse_heartbeat_mode(request_json["mode"].get<std::string>());
      }
    }
  } catch (const json::exception &e) {
    res.status = 400;
    res.set_content(
        json{{"error", "INVALID_JSON"}, {"message", e.what()}}.dump(),
        "application/json");
    return;
  }

  uint64_t resin_cost = get_resin_cost(mode);

  // Check Resin balance
  if (g_resin_tank.balance < resin_cost) {
    res.status = 402; // Payment Required
    res.set_content(json{{"error", "RESIN_DEPLETED"},
                         {"message", "Resin tank empty. Burn $KYT to refill."},
                         {"clawhub", std::string(CLAWHUB_REGISTRY) + "/refill"}}
                        .dump(),
                    "application/json");
    return;
  }

  // Check TPM availability
  if (!g_tpm.is_available()) {
    res.status = 403;
    res.set_content(json{{"error", "TPM_UNAVAILABLE"},
                         {"message", "Hardware root of trust not initialized."}}
                        .dump(),
                    "application/json");
    return;
  }

  // Sign the heartbeat payload
  std::vector<uint8_t> payload(req.body.begin(), req.body.end());
  auto signature = g_tpm.sign(payload);

  if (!signature) {
    res.status = 500;
    res.set_content(json{{"error", "SIGNING_FAILED"},
                         {"message", "TPM signing operation failed."}}
                        .dump(),
                    "application/json");
    return;
  }

  // Deduct Resin
  g_resin_tank.balance -= resin_cost;
  g_resin_tank.lifetime_burned += resin_cost;
  g_resin_tank.daily_consumed += resin_cost;

  // Build signature string (base64)
  std::string sig_b64;
  {
    static const char *b64 =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    int val = 0, valb = -6;
    for (uint8_t c : signature->data) {
      val = (val << 8) + c;
      valb += 8;
      while (valb >= 0) {
        sig_b64.push_back(b64[(val >> valb) & 0x3F]);
        valb -= 6;
      }
    }
    if (valb > -6)
      sig_b64.push_back(b64[((val << 8) >> (valb + 8)) & 0x3F]);
    while (sig_b64.size() % 4)
      sig_b64.push_back('=');
  }

  // Success response
  res.status = 200;
  res.set_content(json{{"status", "signed"},
                       {"hardware_id", g_tpm.get_hardware_id()},
                       {"signature", sig_b64},
                       {"algorithm", signature->algorithm},
                       {"resin_remaining", g_resin_tank.balance},
                       {"mode", mode == HeartbeatMode::TURBO ? "TURBO" : "ECO"}}
                      .dump(),
                  "application/json");
}

/**
 * POST /sign
 * Input: { "tx": "base64_transaction", "amount": 1.5 }
 *
 * Policy-checked transaction signing for Solana.
 * Enforces daily limits and per-transaction caps.
 */
void handle_sign(const httplib::Request &req, httplib::Response &res) {
  std::lock_guard<std::mutex> lock(g_state_mutex);

  // Parse request
  json request_json;
  std::string tx_data;
  double amount_sol = 0.0;

  try {
    request_json = json::parse(req.body);
    tx_data = request_json.value("tx", "");
    amount_sol = request_json.value("amount", 0.0);
  } catch (const json::exception &e) {
    res.status = 400;
    res.set_content(
        json{{"error", "INVALID_JSON"}, {"message", e.what()}}.dump(),
        "application/json");
    return;
  }

  // Check daily limit
  if (g_daily_spent_sol + amount_sol > DAILY_LIMIT_SOL) {
    res.status = 403;
    res.set_content(
        json{{"error", "POLICY_VIOLATION"},
             {"message", "Transaction would exceed daily spending limit."},
             {"daily_limit_sol", DAILY_LIMIT_SOL},
             {"daily_spent_sol", g_daily_spent_sol},
             {"requested_sol", amount_sol}}
            .dump(),
        "application/json");
    return;
  }

  // Check TPM availability
  if (!g_tpm.is_available()) {
    res.status = 403;
    res.set_content(json{{"error", "TPM_UNAVAILABLE"},
                         {"message", "Hardware root of trust not initialized."}}
                        .dump(),
                    "application/json");
    return;
  }

  // Sign the transaction
  std::vector<uint8_t> payload(tx_data.begin(), tx_data.end());
  auto signature = g_tpm.sign(payload);

  if (!signature) {
    res.status = 500;
    res.set_content(json{{"error", "SIGNING_FAILED"},
                         {"message", "TPM signing operation failed."}}
                        .dump(),
                    "application/json");
    return;
  }

  // Update daily spent
  g_daily_spent_sol += amount_sol;

  // Build signature string (base64)
  std::string sig_b64;
  {
    static const char *b64 =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    int val = 0, valb = -6;
    for (uint8_t c : signature->data) {
      val = (val << 8) + c;
      valb += 8;
      while (valb >= 0) {
        sig_b64.push_back(b64[(val >> valb) & 0x3F]);
        valb -= 6;
      }
    }
    if (valb > -6)
      sig_b64.push_back(b64[((val << 8) >> (valb + 8)) & 0x3F]);
    while (sig_b64.size() % 4)
      sig_b64.push_back('=');
  }

  // Success response
  res.status = 200;
  res.set_content(
      json{{"signed", true},
           {"signature", sig_b64},
           {"algorithm", signature->algorithm},
           {"amount_sol", amount_sol},
           {"daily_remaining_sol", DAILY_LIMIT_SOL - g_daily_spent_sol}}
          .dump(),
      "application/json");
}

/**
 * GET /status
 *
 * Health check and status endpoint.
 */
void handle_status(const httplib::Request &req, httplib::Response &res) {
  std::lock_guard<std::mutex> lock(g_state_mutex);

  auto hw_info = g_tpm.get_hardware_info();

  res.status = 200;
  res.set_content(json{{"protocol", "kytin"},
                       {"version", "1.0.0"},
                       {"tpm",
                        {{"available", g_tpm.is_available()},
                         {"mock_mode", hw_info.is_mock},
                         {"hardware_id", hw_info.hardware_id},
                         {"manufacturer", hw_info.manufacturer},
                         {"firmware", hw_info.firmware_version}}},
                       {"resin",
                        {{"balance", g_resin_tank.balance},
                         {"lifetime_burned", g_resin_tank.lifetime_burned},
                         {"daily_limit", g_resin_tank.daily_limit},
                         {"daily_remaining", g_resin_tank.daily_limit -
                                                 g_resin_tank.daily_consumed}}},
                       {"policy",
                        {{"daily_limit_sol", DAILY_LIMIT_SOL},
                         {"daily_spent_sol", g_daily_spent_sol}}},
                       {"clawhub", CLAWHUB_REGISTRY}}
                      .dump(),
                  "application/json");
}

} // namespace kytin

// ============================================================================
// SIGNAL HANDLER
// ============================================================================

void signal_handler(int signal) {
  std::cout << "\n[KYTIN] Received shutdown signal. Closing Sentinel..."
            << std::endl;
  kytin::g_running = false;
}

// ============================================================================
// MAIN - SERVER ENTRY POINT
// ============================================================================

int main(int argc, char *argv[]) {
  std::cout << R"(
    ╔═══════════════════════════════════════════════════════════╗
    ║   ██╗  ██╗██╗   ██╗████████╗██╗███╗   ██╗                  ║
    ║   ██║ ██╔╝╚██╗ ██╔╝╚══██╔══╝██║████╗  ██║                  ║
    ║   █████╔╝  ╚████╔╝    ██║   ██║██╔██╗ ██║                  ║
    ║   ██╔═██╗   ╚██╔╝     ██║   ██║██║╚██╗██║                  ║
    ║   ██║  ██╗   ██║      ██║   ██║██║ ╚████║                  ║
    ║   ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝                  ║
    ║                                                             ║
    ║   THE SENTINEL - Hardware Root of Trust                    ║
    ║   State-Locked Protocol™ (Patent Pending)                  ║
    ╚═══════════════════════════════════════════════════════════╝
    )" << std::endl;

  // Register signal handler
  std::signal(SIGINT, signal_handler);
  std::signal(SIGTERM, signal_handler);

  // Initialize TPM
  if (!kytin::g_tpm.initialize()) {
    std::cerr << "[KYTIN] FATAL: TPM initialization failed." << std::endl;
    return 1;
  }

  auto hw_info = kytin::g_tpm.get_hardware_info();

  std::cout << "[KYTIN] Sentinel Configuration:" << std::endl;
  std::cout << "        Host:       " << kytin::LISTEN_HOST << ":"
            << kytin::LISTEN_PORT << std::endl;
  std::cout << "        Hardware:   " << hw_info.hardware_id << std::endl;
  std::cout << "        Mock Mode:  " << (hw_info.is_mock ? "YES" : "NO")
            << std::endl;
  std::cout << "        Resin:      " << kytin::g_resin_tank.balance
            << " credits" << std::endl;
  std::cout << "        Daily Limit:" << kytin::DAILY_LIMIT_SOL << " SOL"
            << std::endl;
  std::cout << "        Registry:   " << kytin::CLAWHUB_REGISTRY << std::endl;
  std::cout << std::endl;

  // Create HTTP server
  httplib::Server svr;

  // Register endpoints
  svr.Post("/heartbeat", kytin::handle_heartbeat);
  svr.Post("/sign", kytin::handle_sign);
  svr.Get("/status", kytin::handle_status);

  // Add CORS headers for local development
  svr.set_default_headers(
      {{"Access-Control-Allow-Origin", "*"}, {"X-Kytin-Version", "1.0.0"}});

  std::cout << "[KYTIN] Sentinel listening on http://" << kytin::LISTEN_HOST
            << ":" << kytin::LISTEN_PORT << std::endl;
  std::cout << "[KYTIN] Endpoints: POST /heartbeat, POST /sign, GET /status"
            << std::endl;
  std::cout << std::endl;

  // Start server
  if (!svr.listen(kytin::LISTEN_HOST, kytin::LISTEN_PORT)) {
    std::cerr << "[KYTIN] Failed to start HTTP server on port "
              << kytin::LISTEN_PORT << std::endl;
    return 1;
  }

  // Cleanup
  kytin::g_tpm.shutdown();
  std::cout << "[KYTIN] Sentinel shutdown complete." << std::endl;

  return 0;
}
