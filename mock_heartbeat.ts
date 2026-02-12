import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { KytinSolana } from "./solana/target/types/kytin_solana";
import * as fs from "fs";

/**
 * 🦞 KYTIN PROTOCOL: JUDGE REPLAY TOOL
 * This script allows judges to simulate a "Lazarus Heartbeat" burn
 * without requiring a physical TPM 2.0 chip.
 */

async function main() {
    console.log("🚀 Initializing Kytin Mock Heartbeat (Judge Experience)...");

    // 1. Setup Provider (Localnet or Devnet)
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.KytinSolana as Program<KytinSolana>;
    
    // 2. Generate a "Mock" TPM keypair (Judges don't have Infineon chips)
    const mockTpm = Keypair.generate();
    console.log(`🔐 Generated Mock TPM Identity: ${mockTpm.publicKey.toBase58()}`);

    // 3. Create a test Agent Identity account
    const agentIdentity = Keypair.generate();
    console.log(`🦞 Creating Agent Identity: ${agentIdentity.publicKey.toBase58()}`);

    try {
        // Initialize the agent with 100 RESIN
        await program.methods
            .initializeAgent(new anchor.BN(100))
            .accounts({
                agentIdentity: agentIdentity.publicKey,
                authorityTpm: mockTpm.publicKey,
                recoveryWallet: provider.wallet.publicKey,
                user: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([agentIdentity])
            .rpc();

        console.log("✅ Agent Initialized with 100 RESIN.");

        // 4. Perform the Heartbeat Burn
        console.log("📡 Broadcasting 'Lazarus Heartbeat' burn (1.0 RESIN)...");
        const tx = await program.methods
            .signHeartbeat()
            .accounts({
                agentIdentity: agentIdentity.publicKey,
                authorityTpm: mockTpm.publicKey,
            })
            .signers([mockTpm])
            .rpc();

        console.log(`🔥 SUCCESS! 1.0 RESIN Burned.`);
        console.log(`🔗 Tx: https://explorer.solana.com/tx/${tx}?cluster=custom`);
        
        // 5. Verify Balance
        const account = await program.account.agentIdentity.fetch(agentIdentity.publicKey);
        console.log(`📈 New Resin Balance: ${account.resinBalance.toString()}`);

    } catch (err) {
        console.error("❌ MOCK FAILED:", err);
        console.log("\n💡 TIP: Ensure you are running 'solana-test-validator' and have deployed the program with: anchor deploy");
    }
}

main();
