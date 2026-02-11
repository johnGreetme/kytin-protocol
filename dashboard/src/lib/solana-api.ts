
import { Connection, PublicKey, LAMPORTS_PER_SOL, ParsedTransactionWithMeta } from '@solana/web3.js';
import { SentinelStatus } from './kytin-api';

const RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

export async function getDevnetStatus(walletAddress: string): Promise<SentinelStatus> {
  const pubkey = new PublicKey(walletAddress);

  // 1. Get SOL Balance (for Daily Limit / Spent calculation)
  const balance = await connection.getBalance(pubkey);
  const solBalance = balance / LAMPORTS_PER_SOL;

  // 2. Find RESIN Token
  // Heuristic: First token with > 1000 balance (matching start_node.ts logic)
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  });

  let resinBalance = 0;
  let resinMint = '';

  const resinAccount = tokenAccounts.value.find(t => {
    const amount = t.account.data.parsed.info.tokenAmount.uiAmount;
    return amount > 1000;
  });

  if (resinAccount) {
    resinBalance = resinAccount.account.data.parsed.info.tokenAmount.uiAmount;
    resinMint = resinAccount.account.data.parsed.info.mint;
  }

  // 3. Get Recent Transactions (Heartbeats)
  // We count recent transactions as heartbeats for the demo
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 10 });
  const recentHeartbeats = signatures.length;

  // 4. Construct Mocked Status
  return {
    protocol: 'Kytin Protocol (Devnet)',
    version: 'v0.1.0-DEMO',
    tpm: {
      available: true,
      mock_mode: true,
      hardware_id: `DEVNET-${pubkey.toBase58().substring(0, 8)}`,
      manufacturer: 'Solana Devnet',
      firmware: '1.0.0',
    },
    resin: {
      balance: resinBalance,
      lifetime_burned: recentHeartbeats * 1, // Assume 1 burn per tx
      daily_limit: 100,
      daily_remaining: 100, // Mocked
    },
    policy: {
      daily_limit_sol: 1.0,
      daily_spent_sol: 1.0 - solBalance > 0 ? 1.0 - solBalance : 0.1, // Fake spent logic
    },
    clawhub: 'connected',
  };
}

// Check if address is valid
export function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (e) {
    return false;
  }
}
