'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Zap, Skull, Terminal, Wifi, Lock, Flame, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { ResinTank } from '@/components/ResinTank';
import { HeartbeatVisualizer } from '@/components/HeartbeatVisualizer';
import { kytinAPI, SentinelStatus, AgentDeadError } from '@/lib/kytin-api';

export default function MissionControl() {
  const [status, setStatus] = useState<SentinelStatus>({
    version: 'v1.2.0-rc1',
    state: 'online',
    tpm: { hardware_id: 'OFFLINE-MODE', mock_mode: true, policy_hash: '' },
    resin: { balance: 18450, lifetime_burned: 100, capacity: 100000 },
    policy: { daily_limit_sol: 1, daily_spent_sol: 0.23 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await kytinAPI.getStatus();
        setStatus(data);
        setError(null);
      } catch (e) {
        if (e instanceof AgentDeadError) {
           setError('AGENT TERMINATED');
        } else {
           console.warn('Devnet/Local Sentinel unreachable, using mock data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      <Header 
        title="Mission Control" 
        subtitle="Manage your Kytin Sentinel node." 
        activePage="dashboard" 
      />

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        
        {/* Top Grid: Status & Resin */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Block: Identity Card (2 Cols) */}
          <section className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-zinc-800/50 p-1">
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
             <div className="relative h-full bg-zinc-950/50 rounded-[20px] p-8 flex flex-col justify-between">
                
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-sm font-bold text-zinc-500 tracking-widest uppercase mb-1">Agent Status</h2>
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${status.state === 'online' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`} />
                         <span className="text-2xl font-medium text-white tracking-tight capitalize">{status.state}</span>
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                           {status.version}
                         </span>
                      </div>
                   </div>
                   
                   <div className="text-right">
                      <div className="text-xs text-zinc-600 font-mono mb-1">UPTIME</div>
                      <div className="text-xl font-mono text-zinc-300">14d 02h 11m</div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                   <div>
                      <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-bold tracking-wider">
                         <Lock className="w-3 h-3" />
                         HARDWARE SECURITY
                      </div>
                      <div className="font-mono text-sm text-emerald-400/80 bg-emerald-950/30 px-3 py-2 rounded border border-emerald-900/50 truncate">
                         {status.tpm.hardware_id || 'TPM_NOT_DETECTED'}
                      </div>
                   </div>
                   
                   <div>
                      <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-bold tracking-wider">
                         <Shield className="w-3 h-3" />
                         POLICY HASH
                      </div>
                      <div className="font-mono text-sm text-zinc-400 bg-zinc-900/50 px-3 py-2 rounded border border-zinc-800 truncate">
                         {status.tpm.policy_hash || 'PENDING_ATTESTATION'}
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Right Block: Resin Tank (1 Col) */}
          <section className="lg:col-span-1">
             <ResinTank 
               balance={status.resin.balance}
               capacity={status.resin.capacity} 
               lifetimeBurned={status.resin.lifetime_burned}
               onRefill={() => {}} 
             />
          </section>

        </div>

        {/* Middle: Heartbeat (Full Width) */}
        <section className="rounded-3xl bg-zinc-900/20 border border-zinc-800/50 overflow-hidden">
           <div className="px-6 py-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
              <div className="flex items-center gap-2">
                 <Activity className="w-4 h-4 text-emerald-500" />
                 <h3 className="text-sm font-bold text-zinc-300 tracking-wider">HEARTBEAT MONITOR</h3>
              </div>
              <div className="text-xs font-mono text-zinc-600">LIVE FEED • 50ms LATENCY</div>
           </div>
           
           <div className="p-1 bg-[#020202]">
              <HeartbeatVisualizer walletAddress={status.tpm.hardware_id || "8A3F...D47B"} />
           </div>
        </section>

        {/* Bottom Grid: Activity & Logs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* Card 1: Daily Spend */}
           <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Flame className="w-16 h-16 text-orange-500" />
              </div>
              <h4 className="text-zinc-500 text-xs font-bold tracking-wider mb-4">DAILY FUEL SPEND</h4>
              <div className="text-3xl font-bold text-white mb-1">{status.policy.daily_spent_sol} SOL</div>
              <div className="text-sm text-zinc-500">
                 Limit: <span className="text-zinc-400">{status.policy.daily_limit_sol} SOL</span>
              </div>
              <div className="mt-4 w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-orange-500 shadow-[0_0_10px_orange]" 
                   style={{ width: `${(status.policy.daily_spent_sol / status.policy.daily_limit_sol) * 100}%` }} 
                 />
              </div>
           </div>

           {/* Card 2: Environment */}
           <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Wifi className="w-16 h-16 text-cyan-500" />
              </div>
              <h4 className="text-zinc-500 text-xs font-bold tracking-wider mb-4">NETWORK MODE</h4>
              <div className="text-3xl font-bold text-white mb-1">DEVNET</div>
              <div className="text-sm text-zinc-500 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 Connected to Solana Cluster
              </div>
              <div className="mt-4 flex gap-2">
                 <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 font-mono">
                    ver: {status.version}
                 </span>
                 <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 font-mono">
                    latency: 24ms
                 </span>
              </div>
           </div>

           {/* Card 3: Recovery */}
           <Link href="/recovery" className="bg-red-900/5 border border-red-900/30 rounded-2xl p-6 relative overflow-hidden group hover:bg-red-900/10 hover:border-red-500/50 transition-all cursor-pointer">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                 <Skull className="w-16 h-16 text-red-500" />
              </div>
              <h4 className="text-red-500/70 group-hover:text-red-400 text-xs font-bold tracking-wider mb-4 flex items-center gap-2">
                 <AlertTriangle className="w-3 h-3" />
                 EMERGENCY
              </h4>
              <div className="text-2xl font-bold text-red-100 mb-1 group-hover:text-white">Lazarus Protocol</div>
              <p className="text-sm text-red-400/60 group-hover:text-red-300 mt-2 leading-relaxed">
                 Initiate Soul Transfer if hardware is compromised. Irreversible action.
              </p>
           </Link>

        </div>
      </main>
    </div>
  );
}
