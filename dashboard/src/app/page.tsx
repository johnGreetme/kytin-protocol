'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Fuel, Shield, Zap, CheckCircle2, ArrowUp, Activity } from 'lucide-react';

export default function MissionControl() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="border-b border-zinc-900/50 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-500 tracking-tight">
              Mission Control
            </h1>
            <p className="text-xs text-zinc-500 font-medium">Kytin Protocol Dashboard</p>
          </div>

          <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
            <span className="px-5 py-2 text-sm text-emerald-400 bg-zinc-800 rounded-md font-medium shadow-sm">
              Dashboard
            </span>
            <Link href="/explorer" className="px-5 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800">
              Explorer
            </Link>
            <Link href="/recovery" className="px-5 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800">
              Recovery
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Resin Tank */}
          <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-800 p-8 flex flex-col justify-between h-[600px] relative overflow-hidden group">
            
            {/* Header */}
            <div className="flex items-center gap-3">
              <Fuel className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">Resin Tank</h2>
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
                      strokeDashoffset={691 - (691 * 0.84)} 
                      strokeLinecap="round"
                      className="filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold text-white">84%</span>
                    <span className="text-sm text-zinc-500 mt-2">18,450 Resin</span>
                  </div>
               </div>
            </div>

            {/* Estimates */}
            <div className="bg-[#111111] rounded-2xl p-6 mb-6 text-center border border-zinc-800/50">
               <h3 className="text-3xl font-bold text-emerald-500">3075 days</h3>
               <p className="text-sm text-zinc-500 mt-1">remaining at ECO mode</p>
            </div>

            {/* Button */}
            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-lg">
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
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center mb-8 flex-1">
               <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                 <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={3} />
               </div>
               <h3 className="text-3xl font-bold text-emerald-500 mb-2">SOVEREIGN</h3>
               <p className="text-zinc-400">Fully Active</p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="bg-[#111] rounded-xl p-5 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">HARDWARE ID</p>
                <p className="text-lg font-mono text-white tracking-wide">TPM-8A3F-C921-D47B</p>
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
                 <span className="text-white font-mono">0.23 / 1 SOL</span>
               </div>
               <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[23%] rounded-full relative">
                      <div className="absolute top-0 right-0 h-full w-2 bg-white/20" />
                   </div>
               </div>
            </div>

            {/* Mode Logic */}
            <div className="bg-[#111] rounded-xl p-5 border border-zinc-800 mb-8 flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">HEARTBEAT MODE</p>
                  <p className="text-2xl font-bold text-white">ECO</p>
               </div>
               <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded border border-emerald-500/20">
                 1/4hr
               </div>
            </div>

            {/* Recent Heartbeats */}
            <div>
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-4">RECENT HEARTBEATS</p>
              <div className="space-y-3">
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
