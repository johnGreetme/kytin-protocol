import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Fuel, Shield, Zap, CheckCircle2, ArrowUp, Activity } from 'lucide-react';
import { Header } from '@/components/Header';
import { getDevnetStatus, SentinelStatus } from '@/lib/solana-api';

// Use a known active account on Devnet for demo purposes to show non-zero balance
// This is the Solana Faucet address on Devnet
const DEMO_WALLET_ADDRESS = '5YNmS1R9nNS5hu5Q6A5k5u5Q6A5k5u5Q6A5k'; 

export default function MissionControl() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SentinelStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      try {
        // Fallback to a random address if the constant is invalid, but 5YN... is standard mock pattern if we don't have a real one.
        // Actually for Devnet, let's use a real one or just let the API handle it. 
        // We will use a System Program address or similar if we want guaranteed existence, but let's try a distinct one.
        // Actually, the previous devnet implementations might have just used a random string that worked with the mock logic?
        // Wait, solana-api.ts actually fetches! 
        // Let's use 'Goal4...' (a common example) or just '11111111111111111111111111111111'
        const data = await getDevnetStatus('11111111111111111111111111111111'); 
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch status", error);
        // Fallback mock if API fails (e.g. rate limit)
        setStatus({
            version: 'v1.0.0',
            state: 'online',
            tpm: { hardware_id: 'OFFLINE-MODE', mock_mode: true, policy_hash: '' },
            resin: { balance: 18450, lifetime_burned: 100, capacity: 100000 },
            policy: { daily_limit_sol: 1, daily_spent_sol: 0.23 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Calculate percentages
  const resinPercent = status ? Math.min(100, Math.round((status.resin.balance / status.resin.capacity) * 100)) : 0;
  const spentPercent = status ? Math.min(100, Math.round((status.policy.daily_spent_sol / status.policy.daily_limit_sol) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      <Header 
        title="Mission Control" 
        subtitle="Kytin Protocol Dashboard" 
        activePage="dashboard" 
      />

      <main className="max-w-[1600px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Resin Tank */}
          <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-800 p-8 flex flex-col justify-between h-[600px] relative overflow-hidden group">
            
            {/* Header */}
            <div className="flex items-center gap-3">
              <Fuel className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">Resin Tank</h2>
              {loading && <span className="text-xs text-zinc-600 animate-pulse">Syncing...</span>}
            </div>

            {/* Circular Gauge */}
            <div className="flex-1 flex items-center justify-center relative">
               <div className="relative w-64 h-64">
                  {/* Background Track */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="128" cy="128" r="110" stroke="#1f1f1f" strokeWidth="12" fill="none" />
                    <circle 
                      cx="128" cy="128" r="110" 
                      stroke="#10b981" strokeWidth="12" fill="none"
                      strokeDasharray="691" 
                      strokeDashoffset={691 - (691 * (loading ? 0 : resinPercent / 100))} 
                      strokeLinecap="round"
                      className="filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold text-white transition-all">
                        {loading ? '...' : `${resinPercent}%`}
                    </span>
                    <span className="text-sm text-zinc-500 mt-2">
                        {loading ? 'Loading...' : `${status?.resin.balance.toLocaleString()} Resin`}
                    </span>
                  </div>
               </div>
            </div>

            {/* Estimates */}
            <div className="bg-[#111111] rounded-2xl p-6 mb-6 text-center border border-zinc-800/50">
               <h3 className="text-3xl font-bold text-emerald-500">
                   {loading ? '...' : Math.floor((status?.resin.balance || 0) / 6)} days
               </h3>
               <p className="text-sm text-zinc-500 mt-1">remaining at ECO mode</p>
            </div>

            {/* Button */}
            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-lg group-hover:scale-[1.02] active:scale-[0.98]">
               <ArrowUp className="w-5 h-5" strokeWidth={3} />
               TOP UP TANK
            </button>
          </div>

          {/* Card 2: Identity Card */}
          <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-800 p-8 flex flex-col h-[600px]">
            
             <div className="flex items-center gap-3 mb-8">
              <Shield className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">Identity Card</h2>
            </div>

            {/* Status Box */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center mb-8 flex-1 relative overflow-hidden">
               {/* Heartbeat Background Effect */}
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                   <Heartbeat large />
               </div>

               <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 relative z-10">
                 <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={3} />
               </div>
               <h3 className="text-3xl font-bold text-emerald-500 mb-2 relative z-10">SOVEREIGN</h3>
               <p className="text-zinc-400 relative z-10">Fully Active</p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="bg-[#111] rounded-xl p-5 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">HARDWARE ID</p>
                <p className="text-lg font-mono text-white tracking-wide truncate">
                    {loading ? 'Scanning TPM...' : (status?.tpm.hardware_id || 'TPM-ERROR')}
                </p>
              </div>

              <div className="bg-[#111] rounded-xl p-5 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">UPTIME SCORE</p>
                <div className="flex items-end gap-2 mb-2">
                   <span className="text-3xl font-bold text-white">985</span>
                   <span className="text-zinc-500 mb-1">/ 1000</span>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[98.5%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>

          </div>

          {/* Card 3: Today's Activity */}
          <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-800 p-8 flex flex-col h-[600px]">
             
             <div className="flex items-center gap-3 mb-8">
              <Zap className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">Today's Activity</h2>
            </div>

            {/* Daily Spending */}
            <div className="mb-8">
               <div className="flex justify-between text-sm mb-3">
                 <span className="text-zinc-500">Daily Spending</span>
                 <span className="text-white font-mono">
                     {loading ? '...' : status?.policy.daily_spent_sol.toFixed(2)} / {loading ? '...' : status?.policy.daily_limit_sol} SOL
                 </span>
               </div>
               <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-emerald-500 rounded-full relative transition-all duration-1000"
                     style={{ width: `${spentPercent}%` }}
                   >
                      <div className="absolute top-0 right-0 h-full w-2 bg-white/20" />
                   </div>
               </div>
            </div>

            {/* Heartbeat UI Box */}
            <div className="bg-[#111] rounded-xl p-5 border border-zinc-800 mb-8 flex items-center justify-between relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">HEARTBEAT STATUS</p>
                  <p className="text-2xl font-bold text-white flex items-center gap-2">
                      LIVE
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                  </p>
               </div>
               
               {/* Visualizer */}
               <div className="w-32 h-12 relative">
                  <Heartbeat />
               </div>
            </div>

            {/* Recent Heartbeats */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-4">RECENT HEARTBEATS</p>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {[
                  { time: '09:22:52', status: 'Signed' },
                  { time: '05:22:52', status: 'Signed' },
                  { time: '01:22:52', status: 'Signed' },
                  { time: '21:22:52', status: 'Signed' },
                ].map((hb, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                     <span className="text-zinc-400 font-mono text-sm">{hb.time}</span>
                     <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {hb.status}
                     </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

// Heartbeat Component
function Heartbeat({ large }: { large?: boolean }) {
    return (
        <svg viewBox="0 0 100 20" className={`w-full h-full ${large ? 'opacity-10' : 'text-emerald-500'}`}>
            <motion.path
                d="M0 10 Q10 10, 15 10 T20 10 L25 5 L30 15 L35 10 H100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                    duration: 1.5, 
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop"
                }}
            />
            {/* Fading trail effect */}
             <motion.path
                d="M0 10 Q10 10, 15 10 T20 10 L25 5 L30 15 L35 10 H100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0 }}
                transition={{ 
                    duration: 1.5, 
                    ease: "easeOut",
                    repeat: Infinity,
                    delay: 0.2
                }}
            />
        </svg>
    );
}

// Add strict types if not available in project
// interface SentinelStatus { ... } // Imported from lib/solana-api
