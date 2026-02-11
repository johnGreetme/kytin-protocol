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
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// --- CONFIGURATION ---
const RPC_URL = "https://api.devnet.solana.com";
const HEARTBEAT_INTERVAL_MS = 1800000; // 30 Minutes
const BURN_AMOUNT = 1.0; // 1 RESIN (The Real Price)
const GENESIS_AMOUNT = 10000;
const DECIMALS = 9;

// --- MOCK HARDWARE STATE ---
let hardwareCounter = 100; // Simulating the Monotonic Counter
const deviceId = "RPI-DEV-001"; // Simulating TPM Serial Number

async function main() {
    console.clear();
    console.log("🦞 STARTING KYTIN PROTOCOL CLIENT (MOCK NODE)...");
    
    // 1. CONNECT TO DEVNET
    const connection = new Connection(RPC_URL, "confirmed");
    console.log(`[NET] Connected to: ${RPC_URL}`);

    // 2. LOAD WALLET (Your local id.json)
    const homeDir = os.homedir();
    const keyPath = path.join(homeDir, '.config', 'solana', 'id.json');
    if (!fs.existsSync(keyPath)) {
        console.error("❌ ERROR: Could not find Solana Keypair at " + keyPath);
        process.exit(1);
    }
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keyPath, 'utf8')));
    const wallet = Keypair.fromSecretKey(secretKey);
    console.log(`[AUTH] Wallet Loaded: ${wallet.publicKey.toBase58()}`);

    // 3. FIND OR MINT RESIN
    let resinMint: PublicKey;
    
    console.log("[SCAN] Scanning for existing RESIN tokens...");
    
    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID
    });

    // Simple Logic: Find the first token where we have > 1000 balance
    const existingResin = tokenAccounts.value.find(t => {
        const amount = t.account.data.parsed.info.tokenAmount.uiAmount;
        return amount > 1000;
    });

    if (existingResin) {
        resinMint = new PublicKey(existingResin.account.data.parsed.info.mint);
        console.log(`✅ [FOUND] Existing RESIN detected: ${resinMint.toBase58()}`);
        console.log(`   Balance: ${existingResin.account.data.parsed.info.tokenAmount.uiAmount}`);
    } else {
        console.log("⚠️ [404] No RESIN found. Deploying new Genesis Environment...");
        console.log("   Minting new token...");
        
        try {
            resinMint = await createMint(
                connection,
                wallet,
                wallet.publicKey,
                null,
                DECIMALS
            );
            
            const ata = await getOrCreateAssociatedTokenAccount(
                connection,
                wallet,
                resinMint,
                wallet.publicKey
            );

            await mintTo(
                connection,
                wallet,
                resinMint,
                ata.address,
                wallet,
                GENESIS_AMOUNT * (10 ** DECIMALS)
            );
            console.log(`✅ [GENESIS] Minted 10,000 RESIN to ${wallet.publicKey.toBase58()}`);
        } catch (e) {
            console.error("❌ MINT FAILED: ", e);
            process.exit(1);
        }
    }

    // 4. START THE MINING LOOP
    console.log("\n🚀 STARTING PROOF OF PHYSICS HEARTBEAT...");
    console.log("------------------------------------------------");

    setInterval(async () => {
        await runHeartbeat(connection, wallet, resinMint);
    }, HEARTBEAT_INTERVAL_MS);
}

async function runHeartbeat(connection: Connection, wallet: Keypair, mint: PublicKey) {
    try {
        // A. SIMULATE HARDWARE READ
        hardwareCounter++;
        const proofString = `PROOF::${deviceId}::${hardwareCounter}::${Date.now()}`;
        console.log(`\n[TPM] 🔐 Signing Hardware State (Counter: ${hardwareCounter})`);

        // B. PREPARE BURN TRANSACTION
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet,
            mint,
            wallet.publicKey
        );

        // We burn 0.01 tokens
        const amountToBurn = BURN_AMOUNT * (10 ** DECIMALS);

        const tx = new Transaction().add(
            createBurnInstruction(
                ata.address,
                mint,
                wallet.publicKey,
                amountToBurn
            )
        );

        // C. SEND TO SOLANA
        const signature = await sendAndConfirmTransaction(connection, tx, [wallet]);
        
        console.log(`[NET] 📡 Heartbeat Verified on Solana!`);
        console.log(`[ECO] 🔥 Burned ${BURN_AMOUNT} RESIN`);
        console.log(`[CHAIN] https://explorer.solana.com/tx/${signature}?cluster=devnet`);
        
    } catch (err) {
        console.error(`[ERROR] Heartbeat failed: ${err}`);
    }
}

main();
