import { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { 
    mintTo, 
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID 
} from "@solana/spl-token";
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// --- CONFIGURATION ---
const RPC_URL = "https://api.devnet.solana.com";
const SWAP_AMOUNT_SOL = 7;     // The amount you want to spend
const EXCHANGE_RATE = 5000;    // 1 SOL = 5,000 RESIN (Whale Rate)
const RESIN_AMOUNT = SWAP_AMOUNT_SOL * EXCHANGE_RATE;
const DECIMALS = 9;

// A "Treasury" Wallet to receive the SOL (Simulating the DAO)
const TREASURY_KEYPAIR = Keypair.generate();
const TREASURY_PUBKEY = TREASURY_KEYPAIR.publicKey; 

async function main() {
    console.clear();
    console.log("💰 INITIATING RESIN TOP-UP (OTC SWAP)...");
    
    // 1. CONNECT
    const connection = new Connection(RPC_URL, "confirmed");
    const homeDir = os.homedir();
    const keyPath = path.join(homeDir, '.config', 'solana', 'id.json');
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keyPath, 'utf8')));
    const wallet = Keypair.fromSecretKey(secretKey);

    console.log(`[USER] Wallet: ${wallet.publicKey.toBase58()}`);
    
    // Check SOL Balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`[BAL]  Current SOL: ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`);

    if (balance < SWAP_AMOUNT_SOL * LAMPORTS_PER_SOL) {
        console.error("❌ ERROR: Not enough SOL! You need at least 7 SOL.");
        process.exit(1);
    }

    // 2. FIND THE RESIN MINT
    console.log("[SCAN] Locating RESIN Token...");
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID
    });
    
    const resinToken = tokenAccounts.value.find(t => {
        const amount = t.account.data.parsed.info.tokenAmount.uiAmount;
        return amount > 100; // Filter out dust
    });

    if (!resinToken) {
        console.error("❌ ERROR: Could not find RESIN token. Run 'start_node.ts' first!");
        process.exit(1);
    }

    const mintAddress = new PublicKey(resinToken.account.data.parsed.info.mint);
    console.log(`✅ [FOUND] RESIN Mint: ${mintAddress.toBase58()}`);

    // 3. EXECUTE SWAP
    console.log(`\n🔄 SWAPPING ${SWAP_AMOUNT_SOL} SOL for ${RESIN_AMOUNT.toLocaleString()} RESIN...`);

    // A. Transfer SOL to Treasury
    const transferTx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: TREASURY_PUBKEY, 
            lamports: SWAP_AMOUNT_SOL * LAMPORTS_PER_SOL,
        })
    );
    
    try {
        const sig1 = await sendAndConfirmTransaction(connection, transferTx, [wallet]);
        console.log(`   [1/2] 💸 Sent ${SWAP_AMOUNT_SOL} SOL to Treasury.`);
        console.log(`         Tx: https://explorer.solana.com/tx/${sig1}?cluster=devnet`);
    } catch (e) {
        console.error("❌ SOL Transfer Failed:", e);
        process.exit(1);
    }

    // B. Mint RESIN to User
    try {
        const userAta = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet,
            mintAddress,
            wallet.publicKey
        );

        await mintTo(
            connection,
            wallet,
            mintAddress,
            userAta.address,
            wallet, 
            RESIN_AMOUNT * (10 ** DECIMALS)
        );
        console.log(`   [2/2] 💎 Received ${RESIN_AMOUNT.toLocaleString()} RESIN.`);
        
    } catch (e) {
        console.error("❌ Minting Failed:", e);
    }

    console.log("\n✅ TOP-UP COMPLETE!");
    console.log(`   [ECONOMY] Liquidity Injected. Runway Secured.`);
}

main();
