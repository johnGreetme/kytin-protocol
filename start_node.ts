import { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction, 
    sendAndConfirmTransaction 
} from "@solana/web3.js";
import { 
    createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    createBurnInstruction, 
    TOKEN_PROGRAM_ID,
    getAccount
} from "@solana/spl-token";
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// --- CONFIGURATION ---
const RPC_URL = "https://api.devnet.solana.com";
const HEARTBEAT_INTERVAL_MS = 10000; // 10 Seconds (Demo Speed)
// const HEARTBEAT_INTERVAL_MS = 1800000; // 30 Minutes (Mainnet Speed)

// --- PROTOCOL CONSTANTS ---
// NOTE: On Mainnet, this is enforced by the Anchor Program.
const BURN_AMOUNT = 1.0; 
const DECIMALS = 9;

// --- MOCK HARDWARE STATE ---
let hardwareCounter = 280; // Continuing from where you left off
const deviceId = "RPI-DEV-001"; 

async function main() {
    console.clear();
    console.log("🦞 KYTIN PROTOCOL: STATE-LOCKED NODE");
    
    const connection = new Connection(RPC_URL, "confirmed");
    const homeDir = os.homedir();
    const keyPath = path.join(homeDir, '.config', 'solana', 'id.json');
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keyPath, 'utf8')));
    const wallet = Keypair.fromSecretKey(secretKey);
    console.log(`[AUTH] Identity: ${wallet.publicKey.toBase58()}`);

    // FIND RESIN
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID
    });
    const existingResin = tokenAccounts.value.find(t => t.account.data.parsed.info.tokenAmount.uiAmount > 100);
    
    if (!existingResin) {
        console.error("❌ ERROR: No RESIN found. Run 'buy_resin.ts' first!");
        process.exit(1);
    }
    
    const resinMint = new PublicKey(existingResin.account.data.parsed.info.mint);
    console.log(`[FUEL] Tank Located: ${existingResin.account.data.parsed.info.tokenAmount.uiAmount} RESIN`);

    console.log("\n🚀 STARTING HEARTBEAT LOOP...");
    
    setInterval(async () => {
        await runHeartbeat(connection, wallet, resinMint);
    }, HEARTBEAT_INTERVAL_MS);
}

async function runHeartbeat(connection: Connection, wallet: Keypair, mint: PublicKey) {
    try {
        // 1. HARDWARE COUNTS UP (Security)
        hardwareCounter++;
        console.log(`\n[TPM] 🔐 Signing State (Counter: ${hardwareCounter})`);

        // 2. ECONOMY COUNTS DOWN (Burn)
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet,
            mint,
            wallet.publicKey
        );

        const tx = new Transaction().add(
            createBurnInstruction(ata.address, mint, wallet.publicKey, BURN_AMOUNT * (10 ** DECIMALS))
        );

        const signature = await sendAndConfirmTransaction(connection, tx, [wallet]);
        
        // 3. FETCH NEW BALANCE FOR DISPLAY
        // We re-fetch the account info to show the TRUE on-chain balance
        const accountInfo = await getAccount(connection, ata.address);
        const currentBalance = Number(accountInfo.amount) / (10 ** DECIMALS);

        console.log(`[NET] 📡 Verified: https://explorer.solana.com/tx/${signature.slice(0,15)}...`);
        console.log(`[ECO] 🔥 Burned 1.0 RESIN | ⛽️ REMAINING: ${currentBalance.toFixed(2)}`);
        
    } catch (err) {
        console.error(`[ERROR] Heartbeat failed: ${err}`);
    }
}

main();
