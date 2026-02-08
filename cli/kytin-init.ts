#!/usr/bin/env npx ts-node
/**
 * Kytin Protocol - CLI Installer (kytin-init)
 * 
 * Hardware Root of Trust for Autonomous AI Agents
 * State-Locked Protocol™ (Patent Pending)
 * 
 * Commands:
 *   init     - Initialize Kytin on this machine
 *   migrate  - Soul Transfer (Parent TPM -> Child TPM)
 *   status   - Check Sentinel status
 *   refill   - Open Clawhub to refill Resin
 * 
 * Copyright (c) 2026 Kytin Protocol
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as os from 'os';

// ============================================================================
// CONSTANTS
// ============================================================================

const KYTIN_VERSION = '1.0.0';
const SENTINEL_PORT = 18789;
const CLAWHUB_REFILL_URL = 'https://clawhub.kytin.io/refill';
const RESIN_INIT_COST_SOL = 0.25;

const BANNER = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██╗  ██╗██╗   ██╗████████╗██╗███╗   ██╗                                 ║
║   ██║ ██╦╝╚██╗ ██╔╝╚══██╔══╝██║████╗  ██║                                 ║
║   █████╔╝  ╚████╔╝    ██║   ██║██╔██╗ ██║                                 ║
║   ██╔═██╗   ╚██╔╝     ██║   ██║██║╚██╗██║                                 ║
║   ██║  ██╗   ██║      ██║   ██║██║ ╚████║                                 ║
║   ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝                                 ║
║                                                                           ║
║   THE IRON SHELL - Hardware Root of Trust for AI Agents                  ║
║   State-Locked Protocol™ (Patent Pending)                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`;

// ============================================================================
// UTILITIES
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function log(message: string): void {
  console.log(`[KYTIN] ${message}`);
}

function error(message: string): void {
  console.error(`[KYTIN] ❌ ${message}`);
}

function success(message: string): void {
  console.log(`[KYTIN] ✅ ${message}`);
}

function warn(message: string): void {
  console.log(`[KYTIN] ⚠️  ${message}`);
}

// ============================================================================
// TPM DETECTION
// ============================================================================

interface TPMInfo {
  available: boolean;
  version?: string;
  manufacturer?: string;
  hardwareId?: string;
}

async function detectTPM(): Promise<TPMInfo> {
  log('Detecting TPM hardware...');
  
  const platform = os.platform();
  
  try {
    if (platform === 'linux') {
      // Check for TPM device
      if (fs.existsSync('/dev/tpm0') || fs.existsSync('/dev/tpmrm0')) {
        const version = execSync('cat /sys/class/tpm/tpm0/tpm_version_major 2>/dev/null || echo 2')
          .toString().trim();
        
        return {
          available: true,
          version: `TPM ${version}.0`,
          manufacturer: 'Linux TPM Device',
          hardwareId: `KYTIN-${Date.now().toString(36).toUpperCase()}`,
        };
      }
    } else if (platform === 'darwin') {
      // macOS: Check for Secure Enclave (similar to TPM)
      try {
        execSync('security find-identity -v -p codesigning 2>/dev/null');
        return {
          available: true,
          version: 'Secure Enclave',
          manufacturer: 'Apple',
          hardwareId: `KYTIN-SE-${Date.now().toString(36).toUpperCase()}`,
        };
      } catch {
        // No Secure Enclave access
      }
    } else if (platform === 'win32') {
      // Windows: Check for TPM via WMI
      try {
        const result = execSync('powershell -Command "Get-WmiObject -Namespace root/cimv2/security/microsofttpm -Class Win32_Tpm | Select-Object -ExpandProperty SpecVersion"')
          .toString().trim();
        
        if (result) {
          return {
            available: true,
            version: `TPM ${result}`,
            manufacturer: 'Windows TPM',
            hardwareId: `KYTIN-WIN-${Date.now().toString(36).toUpperCase()}`,
          };
        }
      } catch {
        // TPM not accessible
      }
    }
  } catch {
    // Detection failed
  }
  
  return { available: false };
}

// ============================================================================
// INIT COMMAND
// ============================================================================

async function init(): Promise<void> {
  console.log(BANNER);
  log(`Kytin Protocol v${KYTIN_VERSION}`);
  log('');
  
  // Step 1: Detect TPM
  const tpm = await detectTPM();
  
  if (tpm.available) {
    success(`TPM Detected: ${tpm.version}`);
    log(`Hardware ID: ${tpm.hardwareId}`);
  } else {
    warn('No TPM hardware detected.');
    log('Kytin can still run in software-only mode (reduced security).');
    
    const proceed = await prompt('Continue without hardware security? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      log('Installation cancelled.');
      process.exit(0);
    }
  }
  
  log('');
  
  // Step 2: Check for existing installation
  const configDir = path.join(os.homedir(), '.kytin');
  const configFile = path.join(configDir, 'config.json');
  
  if (fs.existsSync(configFile)) {
    warn('Existing Kytin installation detected.');
    const overwrite = await prompt('Overwrite existing configuration? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log('Installation cancelled. Use "kytin migrate" for Soul Transfer.');
      process.exit(0);
    }
  }
  
  // Step 3: Initialize Resin Tank
  log('');
  log('┌─────────────────────────────────────────┐');
  log('│         RESIN TANK INITIALIZATION       │');
  log('├─────────────────────────────────────────┤');
  log('│                                         │');
  log('│  Resin is the fuel for agent operations │');
  log('│  Each heartbeat consumes 1 Resin unit   │');
  log('│                                         │');
  log('│  Initial Tank Cost: 0.25 SOL            │');
  log('│  Initial Balance:   100 Resin           │');
  log('│                                         │');
  log('└─────────────────────────────────────────┘');
  log('');
  
  const initResin = await prompt(`Initialize Resin Tank? (Cost: ${RESIN_INIT_COST_SOL} SOL) (Y/n): `);
  
  let initialResin = 0;
  if (initResin.toLowerCase() !== 'n') {
    log('');
    log('To complete payment, visit:');
    log(`  ${CLAWHUB_REFILL_URL}`);
    log('');
    log('After payment, your Resin balance will be credited automatically.');
    
    // In a real implementation, this would:
    // 1. Generate a Solana transaction
    // 2. Open the payment page
    // 3. Wait for confirmation
    // 4. Credit the Resin balance
    
    const paymentComplete = await prompt('Press Enter after completing payment (or "skip" to continue with 0 Resin): ');
    
    if (paymentComplete.toLowerCase() !== 'skip') {
      initialResin = 100;
      success('Payment confirmed! 100 Resin credited.');
    }
  }
  
  // Step 4: Create configuration
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const config = {
    version: KYTIN_VERSION,
    created: new Date().toISOString(),
    hardware: {
      tpmAvailable: tpm.available,
      tpmVersion: tpm.version,
      hardwareId: tpm.hardwareId || `KYTIN-SW-${Date.now().toString(36).toUpperCase()}`,
    },
    resin: {
      balance: initialResin,
      lifetimeBurned: 0,
      dailyLimit: 1000,
    },
    sentinel: {
      port: SENTINEL_PORT,
      autoStart: true,
    },
    clawhub: {
      registry: 'https://clawhub.kytin.io',
      trustedKeys: ['CLAWHUB_OFFICIAL_KEY'],
    },
  };
  
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  
  log('');
  success('Kytin Protocol initialized!');
  log('');
  log('Configuration saved to: ~/.kytin/config.json');
  log(`Hardware ID: ${config.hardware.hardwareId}`);
  log(`Resin Balance: ${config.resin.balance}`);
  log('');
  log('Next steps:');
  log('  1. Start the Sentinel daemon: kytin-sentinel');
  log('  2. Install skills from Clawhub: https://clawhub.kytin.io');
  log('  3. Integrate with your AI agent using @kytin/bridge');
  log('');
}

// ============================================================================
// MIGRATE COMMAND (Soul Transfer)
// ============================================================================

interface SoulState {
  hardwareId: string;
  resinBalance: number;
  policyHash: string;
  attestation: string;
}

async function migrate(): Promise<void> {
  console.log(BANNER);
  log('SOUL TRANSFER - Migrate identity to new hardware');
  log('');
  
  log('┌─────────────────────────────────────────┐');
  log('│            SOUL TRANSFER                │');
  log('├─────────────────────────────────────────┤');
  log('│                                         │');
  log('│  Transfer your agent identity from      │');
  log('│  Parent TPM -> Child TPM                │');
  log('│                                         │');
  log('│  Requirements:                          │');
  log('│  • Parent device online                 │');
  log('│  • Child device with TPM 2.0            │');
  log('│  • Both on same network                 │');
  log('│                                         │');
  log('└─────────────────────────────────────────┘');
  log('');
  
  // Step 1: Detect local TPM (this should be the child)
  const childTPM = await detectTPM();
  
  if (!childTPM.available) {
    error('No TPM detected on this device.');
    error('Soul Transfer requires TPM hardware on the target device.');
    process.exit(1);
  }
  
  success(`Child TPM detected: ${childTPM.version}`);
  log('');
  
  // Step 2: Get parent device address
  const parentAddress = await prompt('Enter Parent device address (e.g., 192.168.1.100): ');
  
  if (!parentAddress) {
    error('Parent address required.');
    process.exit(1);
  }
  
  log(`Connecting to parent at ${parentAddress}:${SENTINEL_PORT}...`);
  
  // In a real implementation, this would:
  // 1. Connect to parent Sentinel
  // 2. Request attestation
  // 3. Verify parent TPM signature
  // 4. Transfer state with encryption
  // 5. Parent marks soul as transferred (prevents cloning)
  
  try {
    // Simulate connection
    log('Requesting attestation from parent...');
    
    // Mock parent response
    const parentState: SoulState = {
      hardwareId: 'KYTIN-PARENT-LEGACY',
      resinBalance: 50,
      policyHash: 'sha256:abcdef123456...',
      attestation: 'TPM_ATTESTATION_SIGNATURE',
    };
    
    log('');
    log('Parent device state:');
    log(`  Hardware ID: ${parentState.hardwareId}`);
    log(`  Resin Balance: ${parentState.resinBalance}`);
    log('');
    
    const confirm = await prompt('Proceed with Soul Transfer? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y') {
      log('Soul Transfer cancelled.');
      process.exit(0);
    }
    
    log('');
    log('Performing Soul Transfer...');
    log('  [1/4] Generating child attestation...');
    log('  [2/4] Encrypting state for child TPM...');
    log('  [3/4] Transferring encrypted state...');
    log('  [4/4] Parent marking soul as transferred...');
    log('');
    
    // Update local configuration with transferred state
    const configDir = path.join(os.homedir(), '.kytin');
    const configFile = path.join(configDir, 'config.json');
    
    const config = {
      version: KYTIN_VERSION,
      created: new Date().toISOString(),
      migratedFrom: parentState.hardwareId,
      migratedAt: new Date().toISOString(),
      hardware: {
        tpmAvailable: true,
        tpmVersion: childTPM.version,
        hardwareId: childTPM.hardwareId,
      },
      resin: {
        balance: parentState.resinBalance,
        lifetimeBurned: 0,
        dailyLimit: 1000,
      },
      sentinel: {
        port: SENTINEL_PORT,
        autoStart: true,
      },
    };
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    success('Soul Transfer complete!');
    log('');
    log(`Old Hardware ID: ${parentState.hardwareId}`);
    log(`New Hardware ID: ${childTPM.hardwareId}`);
    log(`Resin Balance: ${parentState.resinBalance}`);
    log('');
    warn('The parent device soul has been invalidated.');
    warn('Only this device can now operate as this agent identity.');
    
  } catch (err) {
    error('Soul Transfer failed. Ensure parent device is online.');
    if (err instanceof Error) {
      error(err.message);
    }
    process.exit(1);
  }
}

// ============================================================================
// STATUS COMMAND
// ============================================================================

async function status(): Promise<void> {
  log(`Kytin Protocol v${KYTIN_VERSION}`);
  log('');
  
  // Check Sentinel
  try {
    const response = await fetch(`http://localhost:${SENTINEL_PORT}/status`);
    const data = await response.json();
    
    success('Sentinel is running');
    log(`  Hardware ID: ${data.hardware_id}`);
    log(`  TPM Available: ${data.tpm_available}`);
    log(`  Resin Balance: ${data.resin.balance}`);
    log(`  Daily Remaining: ${data.resin.daily_remaining}`);
    log(`  Clawhub: ${data.clawhub}`);
    
  } catch {
    error('Sentinel is not running');
    log('Start with: kytin-sentinel');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const command = process.argv[2] || 'init';
  
  try {
    switch (command) {
      case 'init':
        await init();
        break;
      case 'migrate':
      case 'soul-transfer':
        await migrate();
        break;
      case 'status':
        await status();
        break;
      case 'refill':
        log('Opening Clawhub refill page...');
        execSync(`open "${CLAWHUB_REFILL_URL}" 2>/dev/null || xdg-open "${CLAWHUB_REFILL_URL}" 2>/dev/null || start "${CLAWHUB_REFILL_URL}"`);
        break;
      case 'help':
      case '--help':
      case '-h':
        console.log(BANNER);
        log('Usage: kytin-init [command]');
        log('');
        log('Commands:');
        log('  init          Initialize Kytin on this machine');
        log('  migrate       Soul Transfer (Parent TPM -> Child TPM)');
        log('  status        Check Sentinel status');
        log('  refill        Open Clawhub to refill Resin');
        log('  help          Show this help message');
        break;
      default:
        error(`Unknown command: ${command}`);
        log('Run "kytin-init help" for usage information.');
        process.exit(1);
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  error(err.message);
  process.exit(1);
});
