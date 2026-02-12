/**
 * ARCHITECTURAL NOTE (HACKATHON MVP):
 * * Current implementation uses a software bridge to verify TPM-signed payloads.
 * * LIMITATION:
 * TPM 2.0 native curves (NIST P-256 / RSA) are not natively supported by
 * Solana runtime (Ed25519) for direct transaction signing.
 * * V2 ROADMAP:
 * - Implement "Binding Signatures": TPM signs a P-256 payload authorizing
 * an ephemeral Ed25519 keypair for a specific slot duration.
 * - This allows on-chain verification of the TPM authorization without
 * requiring the Solana VM to support P-256 directly.
 * * Current "padding" logic is for Devnet demonstration purposes only.
 */
use anchor_lang::prelude::*;

declare_id!("J4ENTKEKD2PwZooNrivcNziHPFK1RuqsxdcQLEp82Sju");

#[program]
pub mod kytin_solana {
    use super::*;

    pub fn initialize_agent(ctx: Context<InitializeAgent>, initial_resin: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent_identity;
        agent.authority_tpm = ctx.accounts.authority_tpm.key();
        agent.recovery_wallet = ctx.accounts.recovery_wallet.key();
        agent.resin_balance = initial_resin;
        agent.reputation = 0;
        agent.is_frozen = false;
        Ok(())
    }

    pub fn recover_identity(ctx: Context<RecoverIdentity>, new_tpm_key: Pubkey) -> Result<()> {
        let agent = &mut ctx.accounts.agent_identity;

        // Verify signer is the recovery wallet (enforced by constraints)
        // Update to new TPM key
        let old_tpm = agent.authority_tpm;
        agent.authority_tpm = new_tpm_key;

        // Unfreeze if needed
        agent.is_frozen = false;

        emit!(IdentityRecovered {
            agent_identity: agent.key(),
            old_tpm,
            new_tpm: new_tpm_key,
        });

        Ok(())
    }

    pub fn sign_heartbeat(ctx: Context<SignHeartbeat>) -> Result<()> {
        let agent = &mut ctx.accounts.agent_identity;
        require!(!agent.is_frozen, CustomError::AgentFrozen);

        // Burn 1 Resin
        require!(agent.resin_balance >= 1, CustomError::InsufficientResin);
        agent.resin_balance -= 1;

        // TODO: Mint Heartbeat Token / Update uptime score

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeAgent<'info> {
    #[account(init, payer = user, space = 8 + 32 + 32 + 8 + 2 + 1)]
    pub agent_identity: Account<'info, AgentIdentity>,
    /// CHECK: This is the initial TPM key
    pub authority_tpm: UncheckedAccount<'info>,
    /// CHECK: This is the cold wallet backup
    pub recovery_wallet: UncheckedAccount<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecoverIdentity<'info> {
    #[account(
        mut,
        has_one = recovery_wallet @ CustomError::InvalidRecoveryWallet
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
    pub recovery_wallet: Signer<'info>,
}

#[derive(Accounts)]
pub struct SignHeartbeat<'info> {
    #[account(
        mut,
        has_one = authority_tpm @ CustomError::InvalidTPMSigner
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
    pub authority_tpm: Signer<'info>,
}

#[account]
pub struct AgentIdentity {
    pub authority_tpm: Pubkey,   // The active "CEO" (TPM Key)
    pub recovery_wallet: Pubkey, // The "Board" (Ledger/Cold Wallet)
    pub resin_balance: u64,
    pub reputation: u16,
    pub is_frozen: bool,
}

#[event]
pub struct IdentityRecovered {
    pub agent_identity: Pubkey,
    pub old_tpm: Pubkey,
    pub new_tpm: Pubkey,
}

#[error_code]
pub enum CustomError {
    #[msg("Invalid recovery wallet signer.")]
    InvalidRecoveryWallet,
    #[msg("Invalid TPM signer.")]
    InvalidTPMSigner,
    #[msg("Agent identity is frozen.")]
    AgentFrozen,
    #[msg("Insufficient Resin balance.")]
    InsufficientResin,
}
