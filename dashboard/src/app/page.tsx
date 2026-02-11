'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Skull, RefreshCw, Zap, Activity, Settings } from 'lucide-react';
import Link from 'next/link';

import { ResinTank } from '@/components/ResinTank';
import { SentinelMap } from '@/components/SentinelMap';
import { HeartbeatPulse } from '@/components/HeartbeatPulse';
import { kytinAPI, AgentState, SentinelStatus, AgentDeadError, DeadAgentError } from '@/lib/kytin-api';
import { getDevnetStatus, isValidAddress } from '@/lib/solana-api';

export default function Dashboard() {
  const [agentState, setAgentState] = useState<AgentState>('offline');
  const [status, setStatus] = useState<SentinelStatus | null>(null);
  const [deadInfo, setDeadInfo] = useState<DeadAgentError | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDevnetMode, setIsDevnetMode] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [inputAddress, setInputAddress] = useState('');

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      if (isDevnetMode && walletAddress) {
        const result = await getDevnetStatus(walletAddress);
        setAgentState('online');
        setStatus(result);
        setDeadInfo(null);
      } else {
        const result = await kytinAPI.getAgentState();
        setAgentState(result.state);
        
        if (result.state === 'online' && result.data) {
          setStatus(result.data as SentinelStatus);
          setDeadInfo(null);
        } else if (result.state === 'dead' && result.data) {
          setDeadInfo(result.data as DeadAgentError);
          setStatus(null);
        } else {
          setStatus(null);
          setDeadInfo(null);
        }
      }
    } catch (e) {
       // If Devnet fetch fails, we stay in devnet mode but maybe show error? 
       // For now, consistent behavior:
      if (!isDevnetMode) {
          setAgentState('offline');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDevnetMode, walletAddress]);

  // Initial load and polling
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Connect to Devnet
  const handleConnect = () => {
    if (isValidAddress(inputAddress)) {
      setWalletAddress(inputAddress);
      setIsDevnetMode(true);
      setIsLoading(true);
      fetchStatus();
    }
  };

  // Send heartbeat
  const sendHeartbeat = async () => {
    if (agentState !== 'online') return;
    
    if (isDevnetMode) {
        alert("Cannot sign heartbeats in Read-Only Devnet Mode. Run the local node!");
        return;
    }

    try {
      setIsAnimating(true);
      const result = await kytinAPI.heartbeat('ECO');
      setLastSignature(result.signature);
      
      // Update resin
      if (status) {
        setStatus({
          ...status,
          resin: {
            ...status.resin,
            balance: result.resin_remaining,
            lifetime_burned: status.resin.lifetime_burned + 1,
          }
        });
      }
      
      setTimeout(() => setIsAnimating(false), 500);
    } catch (e) {
      if (e instanceof AgentDeadError) {
        setAgentState('dead');
        setDeadInfo(e.details);
      }
      setIsAnimating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center"
              animate={{
                boxShadow: agentState === 'online' 
                  ? ['0 0 20px rgba(16, 185, 129, 0.3)', '0 0 40px rgba(16, 185, 129, 0.5)', '0 0 20px rgba(16, 185, 129, 0.3)']
                  : 'none'
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {agentState === 'dead' ? (
                <Skull className="w-5 h-5 text-white" />
              ) : (
                <Shield className="w-5 h-5 text-white" />
              )}
            </motion.div>
            <div>
              <h1 className="text-lg font-bold">KYTIN MISSION CONTROL</h1>
              <p className="text-xs text-zinc-500">State-Locked Protocol™</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              agentState === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              agentState === 'dead' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
              'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                agentState === 'online' ? 'bg-emerald-500' :
                agentState === 'dead' ? 'bg-red-500' :
                'bg-zinc-500'
              }`} />
              {agentState.toUpperCase()}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchStatus}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Migration Link */}
            <Link
              href="/migrate"
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              <Skull className="w-4 h-4" />
              Soul Transfer
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <motion.div
              className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map - Takes 2 columns */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                AGENT STATUS
              </h2>
              <SentinelMap
                state={agentState}
                hardwareId={status?.tpm.hardware_id || deadInfo?.child_key?.substring(0, 24)}
                childKey={deadInfo?.child_key}
                lastWillSignature={deadInfo?.last_will_signature}
              />
            </div>

            {/* Resin Tank */}
            <div>
              <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                FUEL RESERVES
              </h2>
              <ResinTank
                balance={status?.resin.balance ?? 0}
                lifetime_burned={status?.resin.lifetime_burned ?? 0}
                isAnimating={isAnimating}
              />
            </div>

            {/* Heartbeat */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                HEARTBEAT MONITOR
              </h2>
              <HeartbeatPulse
                isActive={agentState === 'online'}
                resinRemaining={status?.resin.balance}
                lastSignature={lastSignature ?? undefined}
                onPulse={sendHeartbeat}
              />
            </div>

            {/* Info Panel */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 p-6">
              <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                SENTINEL INFO
              </h2>
              
              {status && (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">HARDWARE ID</p>
                    <p className="font-mono text-emerald-400 break-all">{status.tpm.hardware_id}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">TPM MODE</p>
                    <p className={status.tpm.mock_mode ? 'text-amber-400' : 'text-emerald-400'}>
                      {status.tpm.mock_mode ? '🧪 MOCK' : '🔐 HARDWARE'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">DAILY LIMIT</p>
                    <p className="text-white">{status.policy.daily_limit_sol} SOL</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">TODAY SPENT</p>
                    <p className="text-white">{status.policy.daily_spent_sol} SOL</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">PROTOCOL VERSION</p>
                    <p className="text-zinc-400">{status.version}</p>
                  </div>
                </div>
              )}

              {deadInfo && (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">STATUS</p>
                    <p className="text-red-400 font-bold">⚰️ DECEASED</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">SUCCESSOR</p>
                    <p className="font-mono text-amber-400 break-all">{deadInfo.child_key}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">LAST WILL</p>
                    <p className="font-mono text-zinc-400 break-all text-xs">{deadInfo.last_will_signature.substring(0, 40)}...</p>
                  </div>
                </div>
              )}

              {agentState === 'offline' && (
                <div className="text-center py-8">
                  <p className="text-zinc-500">No connection to Sentinel</p>
                  <p className="text-xs text-zinc-600 mt-2">Run: ./kytin_sentinel</p>
                  
                  <div className="mt-8 pt-6 border-t border-zinc-800">
                    <p className="text-sm font-medium text-emerald-400 mb-3">OR CONNECT VIA DEVNET</p>
                    <div className="flex gap-2 max-w-sm mx-auto">
                        <input 
                        type="text" 
                        placeholder="Enter Wallet Address..." 
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none transition-colors"
                        value={inputAddress}
                        onChange={(e) => setInputAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                        />
                        <button 
                        onClick={handleConnect}
                        disabled={!inputAddress}
                        className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                        Connect
                        </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 flex justify-between text-xs text-zinc-600">
          <span>© 2026 Kytin Protocol. State-Locked Protocol™ (Patent Pending)</span>
          <a href="https://clawhub.kytin.io" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">
            clawhub.kytin.io
          </a>
        </div>
      </footer>
    </div>
  );
}
