import { PublicKey, Connection } from '@solana/web3.js';

// Kytin Solana Program ID
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/**
 * Derives the stable Identity PDA for an agent handle.
 * This is the "Corporate Personhood" address that never changes, even if the TPM key rotates.
 */
export async function getPaymentAddress(agentHandle: string): Promise<PublicKey> {
  const [identityPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("agent"), Buffer.from(agentHandle)],
    PROGRAM_ID
  );
  return identityPDA;
}

/**
 * Resolves the payment address for a given agent.
 * 
 * @param connection Solana connection
 * @param agentHandle The unique handle of the agent (e.g. "agent-007")
 * @returns The PDA PublicKey to send SOL/tokens to
 */
export async function resolveAgentToPay(connection: Connection, agentHandle: string): Promise<PublicKey> {
    const pda = await getPaymentAddress(agentHandle);
    console.log(`[KYTIN] Resolved ${agentHandle} to Identity PDA: ${pda.toString()}`);
    return pda;
}
