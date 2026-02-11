import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const TITAN_BURN_MIN = 10.0; // The Law

const ANNUAL_TITAN_BURN = 175200; // 10.0 * 2 * 24 * 365

async function monitorNode(nodePubKey: string) {
    console.log(`👮 WATCHDOG ACTIVE: Monitoring ${nodePubKey}`);
    console.log(`TYPE: npx ts-node watchdog.ts <PUBKEY> to run separate instance`);
    
    try {
        const pubKey = new PublicKey(nodePubKey);
        connection.onLogs(pubKey, (logs) => {
            if (logs.err) return;
            
            // Look for the "Burn" instruction in the logs
            const txSignature = logs.signature;
            console.log(`\n🔎 Inspecting Signature: ${txSignature.slice(0,15)}...`);
            
            // Fetch the transaction to verify the ACTUAL burn amount
            connection.getParsedTransaction(txSignature, { maxSupportedTransactionVersion: 0 })
                .then(tx => {
                    const burnAmount = getBurnAmountFromTx(tx);
                    
                    if (burnAmount < TITAN_BURN_MIN) {
                        console.log(`🚨 FRAUD DETECTED! Node burned only ${burnAmount.toFixed(4)} RESIN.`);
                        console.log(`   Signature: ${txSignature}`);
                        // Here you would trigger the Dashboard to show "BANNED"
                    } else {
                        console.log(`✅ VALID HEARTBEAT: ${burnAmount.toFixed(4)} RESIN burned.`);
                        console.log(`[PROJECTION] This node is on track to burn ${ANNUAL_TITAN_BURN.toLocaleString()} RESIN this year.`);
                    }
                })
                .catch(err => {
                   // console.error("Error fetching tx:", err);
                });
        }, "confirmed");
    } catch (e) {
        console.error("Invalid Public Key:", nodePubKey);
    }
}

function getBurnAmountFromTx(tx: any): number {
    if (!tx) return 0;
    let totalBurn = 0;

    // 1. Check Top-Level Instructions
    const instructions = tx.transaction?.message?.instructions || [];
    for (const ix of instructions) {
        if (ix.parsed && ix.parsed.type === "burn") {
             totalBurn += (ix.parsed.info.amount / 1_000_000_000);
        }
    }

    // 2. Check Inner Instructions
    const innerInstructions = tx.meta?.innerInstructions || [];
    for (const inner of innerInstructions) {
        for (const ix of inner.instructions) {
             if (ix.parsed && ix.parsed.type === "burn") {
                 totalBurn += (ix.parsed.info.amount / 1_000_000_000);
             }
        }
    }
    return totalBurn;
}

// CLI Entry Point
const targetPubKey = process.argv[2];
if (!targetPubKey) {
    console.log("Usage: npx ts-node watchdog.ts <PUBKEY>");
    console.log("Example: npx ts-node watchdog.ts HWzSn67G3Zv9GaFDwL8SSZSbwMiEXSmfe4RsSJNovbnT");
    process.exit(1);
}

monitorNode(targetPubKey);
