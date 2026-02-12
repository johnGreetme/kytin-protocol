#!/usr/bin/env npx ts-node
/**
 * Kytin Protocol - Soul Transfer Migration CLI
 *
 * Usage:
 *   npx kytin-migrate --receive    (Child/New Machine)
 *   npx kytin-migrate --kill       (Parent/Old Machine)
 *
 * State-Locked Protocol™ (Patent Pending)
 * Copyright (c) 2026 Kytin Protocol
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SENTINEL_URL = 'http://localhost:18789';
const CONFIG_DIR = path.join(process.env.HOME || '~', '.kytin');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// ============================================================================
// TYPES
// ============================================================================

interface MigrateResponse {
  status: string;
  last_will_signature: string;
  parent_pubkey: string;
  child_key: string;
  payload: string;
  algorithm: string;
  message: string;
}

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

function printBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗  ██╗██╗   ██╗████████╗██╗███╗   ██╗                     ║
║   ██║ ██╔╝╚██╗ ██╔╝╚══██╔══╝██║████╗  ██║                     ║
║   █████╔╝  ╚████╔╝    ██║   ██║██╔██╗ ██║                     ║
║   ██╔═██╗   ╚██╔╝     ██║   ██║██║╚██╗██║                     ║
║   ██║  ██╗   ██║      ██║   ██║██║ ╚████║                     ║
║   ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝                     ║
║                                                               ║
║   🔄 SOUL TRANSFER - Hardware Migration Protocol 🔄           ║
║   State-Locked Protocol™ (Patent Pending)                     ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

function printQRCode(data: string) {
  // Simple ASCII QR-like representation (actual QR would need qrcode library)
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  📱 SCAN THIS ON YOUR NEW MACHINE 📱   ║');
  console.log('╠════════════════════════════════════════╣');
  console.log('║                                        ║');
  console.log('║  [QR CODE PLACEHOLDER]                 ║');
  console.log('║                                        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\n📋 Or manually copy this public key:\n');
  console.log(`   ${data}`);
  console.log('');
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} (yes/no): `);
  return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

// ============================================================================
// KEY GENERATION (Mock - in production would use TPM)
// ============================================================================

function generateKeyPair(): KeyPair {
  // Generate Ed25519-like keypair (using Node crypto for demo)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

  const pubKeyHex = publicKey.export({ type: 'spki', format: 'der' }).toString('hex');
  const privKeyHex = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex');

  return {
    publicKey: pubKeyHex,
    privateKey: privKeyHex,
  };
}

// ============================================================================
// MODE A: RECEIVE (Child/New Machine)
// ============================================================================

async function receiveMode() {
  console.log('\n🆕 MODE: RECEIVE (New Machine)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Generating new keypair for this machine...');
  const keypair = generateKeyPair();

  console.log('✅ Keypair generated!\n');

  printQRCode(keypair.publicKey);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 INSTRUCTIONS:');
  console.log('   1. Copy the public key above');
  console.log('   2. On your OLD machine, run: npx kytin-migrate --kill');
  console.log('   3. Paste this public key when prompted');
  console.log('   4. The old machine will sign a "Last Will" transferring authority');
  console.log('   5. Broadcast the signature to Solana to complete migration');
  console.log('\n⏳ Waiting for resurrection confirmation...\n');

  // In a real implementation, this would poll for on-chain confirmation
  // For now, we just prompt the user
  const lastWillSig = await prompt('Enter the last_will_signature from the old machine: ');

  if (!lastWillSig) {
    console.log('❌ No signature provided. Migration cancelled.');
    process.exit(1);
  }

  // Save config
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const config = {
    public_key: keypair.publicKey,
    private_key: keypair.privateKey,
    migrated_from: null as string | null,
    last_will_signature: lastWillSig,
    created_at: new Date().toISOString(),
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

  console.log('\n✅ RESURRECTION COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   New Hardware ID: ${keypair.publicKey.substring(0, 32)}...`);
  console.log(`   Config saved to: ${CONFIG_FILE}`);
  console.log('\n🦞 Your agent has been resurrected on this machine!');
  console.log('   Run: npx kytin-init to start the Sentinel\n');
}

// ============================================================================
// MODE B: KILL (Parent/Old Machine)
// ============================================================================

async function killMode() {
  console.log('\n⚰️  MODE: KILL (Old Machine)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⚠️  WARNING: This action is IRREVERSIBLE!');
  console.log('   • This Sentinel will be permanently disabled');
  console.log('   • All future signing requests will fail (410 GONE)');
  console.log('   • Authority will transfer to the child key you provide\n');

  const childKey = await prompt('Enter the Child Public Key from your new machine: ');

  if (!childKey || childKey.length < 32) {
    console.log('❌ Invalid child key. Migration cancelled.');
    process.exit(1);
  }

  console.log(`\n📍 Child Key: ${childKey.substring(0, 32)}...`);

  const confirmed = await confirm('\n⚠️  Are you ABSOLUTELY SURE you want to execute Soul Transfer?');

  if (!confirmed) {
    console.log('\n❌ Migration cancelled by user.');
    process.exit(0);
  }

  console.log('\n🔄 Calling Sentinel /migrate endpoint...');

  try {
    const response = await fetch(`${SENTINEL_URL}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        child_key: childKey,
        auth_token: 'local_migration',
      }),
    });

    if (!response.ok) {
      if (response.status === 410) {
        console.log('\n❌ This Sentinel is already dead. Soul Transfer was previously executed.');
      } else {
        const error = await response.json();
        console.log(`\n❌ Migration failed: ${error.message || response.statusText}`);
      }
      process.exit(1);
    }

    const result = (await response.json()) as MigrateResponse;

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║        ⚰️  SOUL TRANSFER EXECUTED SUCCESSFULLY  ⚰️           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\n📜 LAST WILL (Death Certificate):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Parent:    ${result.parent_pubkey}`);
    console.log(`   Child:     ${result.child_key.substring(0, 40)}...`);
    console.log(`   Signature: ${result.last_will_signature.substring(0, 40)}...`);
    console.log(`   Algorithm: ${result.algorithm}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 FULL SIGNATURE (copy this to your new machine):');
    console.log(`\n   ${result.last_will_signature}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️  Cleaning up local configuration...');

    // Delete local config
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
      console.log(`   Deleted: ${CONFIG_FILE}`);
    }

    console.log('\n✅ This Sentinel is now DEAD.');
    console.log('   All future /sign and /heartbeat calls will return 410 GONE.');
    console.log('\n📌 NEXT STEPS:');
    console.log('   1. Copy the signature above to your new machine');
    console.log('   2. Broadcast to Solana to finalize on-chain migration');
    console.log('   3. You can safely shut down this machine\n');

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n❌ Cannot connect to Sentinel. Is it running?');
        console.log('   Run: cd sentinel/build && ./kytin_sentinel');
      } else {
        console.log(`\n❌ Error: ${error.message}`);
      }
    }
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  printBanner();

  const args = process.argv.slice(2);

  if (args.includes('--receive') || args.includes('-r')) {
    await receiveMode();
  } else if (args.includes('--kill') || args.includes('-k')) {
    await killMode();
  } else {
    console.log('Usage:');
    console.log('  npx kytin-migrate --receive    Start receiving on NEW machine');
    console.log('  npx kytin-migrate --kill       Execute Soul Transfer on OLD machine');
    console.log('');
    console.log('Options:');
    console.log('  -r, --receive   Generate new keypair and wait for migration');
    console.log('  -k, --kill      Kill this Sentinel and transfer authority');
    console.log('');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
