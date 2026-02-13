
// Native implementation using fetch to avoid heavy web3.js bundle
const RPC_URL = 'https://api.devnet.solana.com';

export interface SentinelStatus {
    version: string;
    state: 'online' | 'offline' | 'error';
    tpm: {
        hardware_id: string;
        mock_mode: boolean;
        policy_hash: string;
    };
    resin: {
        balance: number;
        lifetime_burned: number;
        capacity: number;
    };
    policy: {
        daily_limit_sol: number;
        daily_spent_sol: number;
    };
}

export async function getDevnetStatus(walletAddress: string): Promise<SentinelStatus> {
  try {
      // 1. Get Real SOL Balance form Devnet
      const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "getBalance",
              params: [walletAddress]
          })
      });

      const data = await response.json();
      const lamports = data.result?.value || 0;
      const solBalance = lamports / 1000000000; // 10^9

      // 2. Construct Status based on Real Devnet Data
      // If we have SOL, we assume we have "Resin" (proportional mock)
      // 1 SOL = 22,000 Resin (arbitrary exchange rate for demo)
      
      const resinBalance = Math.floor(solBalance * 22000); 

      return {
          version: 'v1.2.0-rc1 (DEVNET)',
          state: 'online',
          tpm: {
              hardware_id: walletAddress, // Use the real wallet address as ID
              mock_mode: true,
              policy_hash: 'DEVNET_VERIFIED_HASH'
          },
          resin: {
              balance: resinBalance > 0 ? resinBalance : 0,
              lifetime_burned: 120, // Mock constant
              capacity: 100000
          },
          policy: {
              daily_limit_sol: 1.0,
              daily_spent_sol: Math.max(0, 1.0 - solBalance) // Calculate spent based on balance vs limit
          }
      };

  } catch (e) {
      console.error("Devnet Fetch Error", e);
      throw e;
  }
}

// Simple regex check for base58 length (32-44 chars)
export function isValidAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
