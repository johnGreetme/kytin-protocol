import { Connection } from "@solana/web3.js";

/**
 * Verifies if the local node is synchronized with the Solana cluster.
 * @param rpcUrl The RPC endpoint to check (typically http://localhost:8899 for local nodes)
 * @returns boolean true if synced, false otherwise
 */
export async function verifySync(rpcUrl: string = "http://localhost:8899"): Promise<boolean> {
    const connection = new Connection(rpcUrl, "confirmed");
    
    try {
        const { value: epochInfo } = await connection.getEpochInfo();
        const slot = await connection.getSlot();
        
        const drift = epochInfo.absoluteSlot - slot;
        console.log(`[SYNC] Local Slot: ${slot} | Cluster Tip: ${epochInfo.absoluteSlot} | Drift: ${drift}`);
        
        // Considering "synced" if we are within 150 slots of the tip
        if (drift < 150) {
            console.log("✅ SYSTEM READY: Node is synced.");
            return true;
        } else {
            console.log(`⚠️ SYNCING: ${drift} slots remaining...`);
            return false;
        }
    } catch (err) {
        console.error("❌ ERROR: Could not connect to node RPC. Check internet and solana-validator status.");
        return false;
    }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifySync().then(synced => process.exit(synced ? 0 : 1));
}
