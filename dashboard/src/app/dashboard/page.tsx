'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Fuel, AlertTriangle, CheckCircle, ArrowUp } from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with actual API calls
const MOCK_STATUS = {
  tier: 'SOVEREIGN' as const,
  hardware_id: 'TPM-8A3F-C921-D47B',
  resin_remaining: 18450,
  resin_total: 22000,
  uptime_score: 985,
  heartbeat_mode: 'ECO' as const,
  daily_limit_sol: 1.0,
  spent_today_sol: 0.23,
};

type Tier = 'GHOST' | 'SILICON' | 'SENTINEL' | 'SOVEREIGN';

const TIER_CONFIG: Record<Tier, { color: string; icon: typeof Shield; label: string }> = {
  GHOST: { color: '#6b7280', icon: AlertTriangle, label: 'No Hardware' },
  SILICON: { color: '#eab308', icon: Shield, label: 'TPM Detected' },
  SENTINEL: { color: '#3b82f6', icon: Shield, label: 'Registered' },
  SOVEREIGN: { color: '#00ff9d', icon: CheckCircle, label: 'Fully Active' },
};

export default function DashboardPage() {
  const [status, setStatus] = useState(MOCK_STATUS);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const resinPercentage = (status.resin_remaining / status.resin_total) * 100;
  const daysRemaining = Math.floor(status.resin_remaining / 6); // 6 resin/day for ECO mode
  const isLowFuel = daysRemaining < 7;
  const isCriticalFuel = daysRemaining < 3;

  const tierConfig = TIER_CONFIG[status.tier];
  const TierIcon = tierConfig.icon;

  // Calculate gauge path
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (resinPercentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-[#00ff9d]">Mission Control</h1>
          <p className="text-gray-500">Kytin Protocol Dashboard</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-[#00ff9d]/20 text-[#00ff9d]">Dashboard</Link>
          <Link href="/explorer" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Explorer</Link>
          <Link href="/recovery" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Recovery</Link>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resin Tank (Left) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] rounded-2xl p-8 border border-[#222]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Fuel className="text-[#00ff9d]" />
            <h2 className="text-xl font-semibold">Resin Tank</h2>
          </div>

          {/* Circular Gauge */}
          <div className="relative flex justify-center items-center my-8">
            <svg width="200" height="200" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#222"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={isCriticalFuel ? '#ef4444' : isLowFuel ? '#eab308' : '#00ff9d'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-4xl font-bold">{Math.round(resinPercentage)}%</div>
              <div className="text-gray-500 text-sm">{status.resin_remaining.toLocaleString()} Resin</div>
            </div>
          </div>

          {/* Days Remaining */}
          <div className={`text-center p-4 rounded-xl ${isCriticalFuel ? 'bg-red-500/20' : isLowFuel ? 'bg-yellow-500/20' : 'bg-[#00ff9d]/10'}`}>
            <span className={`text-2xl font-bold ${isCriticalFuel ? 'text-red-500' : isLowFuel ? 'text-yellow-500' : 'text-[#00ff9d]'}`}>
              {daysRemaining} days
            </span>
            <p className="text-gray-400 text-sm">remaining at {status.heartbeat_mode} mode</p>
          </div>

          {/* Top Up Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsTopUpOpen(true)}
            className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-[#00ff9d] to-[#00cc7d] text-black font-bold flex items-center justify-center gap-2"
          >
            <ArrowUp size={20} />
            TOP UP TANK
          </motion.button>
        </motion.div>

        {/* Identity Card (Middle) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111] rounded-2xl p-8 border border-[#222]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-[#00ff9d]" />
            <h2 className="text-xl font-semibold">Identity Card</h2>
          </div>

          {/* Tier Badge */}
          <div 
            className="p-6 rounded-xl mb-6 text-center"
            style={{ backgroundColor: `${tierConfig.color}20`, borderColor: tierConfig.color, borderWidth: 1 }}
          >
            <TierIcon size={48} style={{ color: tierConfig.color }} className="mx-auto mb-3" />
            <div className="text-2xl font-bold" style={{ color: tierConfig.color }}>{status.tier}</div>
            <div className="text-gray-400 text-sm">{tierConfig.label}</div>
          </div>

          {/* Hardware ID */}
          <div className="bg-[#0a0a0a] rounded-xl p-4 mb-4">
            <div className="text-gray-500 text-xs mb-1">HARDWARE ID</div>
            <div className="font-mono text-sm">{status.hardware_id}</div>
          </div>

          {/* Uptime Score */}
          <div className="bg-[#0a0a0a] rounded-xl p-4">
            <div className="text-gray-500 text-xs mb-1">UPTIME SCORE</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{status.uptime_score}</div>
              <div className="text-gray-500">/ 1000</div>
            </div>
            <div className="mt-2 h-2 bg-[#222] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00ff9d] rounded-full transition-all"
                style={{ width: `${(status.uptime_score / 1000) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Activity Panel (Right) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111] rounded-2xl p-8 border border-[#222]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-[#00ff9d]" />
            <h2 className="text-xl font-semibold">Today&apos;s Activity</h2>
          </div>

          {/* Daily Limit */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Daily Spending</span>
              <span>{status.spent_today_sol} / {status.daily_limit_sol} SOL</span>
            </div>
            <div className="h-3 bg-[#222] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00ff9d] rounded-full transition-all"
                style={{ width: `${(status.spent_today_sol / status.daily_limit_sol) * 100}%` }}
              />
            </div>
          </div>

          {/* Heartbeat Mode */}
          <div className="bg-[#0a0a0a] rounded-xl p-4 mb-4">
            <div className="text-gray-500 text-xs mb-1">HEARTBEAT MODE</div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">{status.heartbeat_mode}</span>
              <span className={`px-3 py-1 rounded-full text-xs ${status.heartbeat_mode === 'TURBO' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                {status.heartbeat_mode === 'TURBO' ? '60/hr' : '1/4hr'}
              </span>
            </div>
          </div>

          {/* Recent Heartbeats */}
          <div className="space-y-3">
            <div className="text-gray-500 text-xs">RECENT HEARTBEATS</div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-[#0a0a0a] rounded-lg p-3">
                <span className="text-gray-400">
                  {new Date(Date.now() - i * 4 * 60 * 60 * 1000).toLocaleTimeString()}
                </span>
                <span className="text-[#00ff9d]">✓ Signed</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] rounded-2xl p-8 max-w-md w-full mx-4 border border-[#222]"
          >
            <h3 className="text-2xl font-bold mb-4">Top Up Resin Tank</h3>
            <p className="text-gray-400 mb-6">Burn SOL to mint Resin credits for your agent.</p>
            
            <div className="space-y-4 mb-6">
              <button className="w-full p-4 rounded-xl bg-[#0a0a0a] border border-[#333] hover:border-[#00ff9d] transition text-left">
                <div className="font-bold">0.25 SOL</div>
                <div className="text-gray-500 text-sm">22,000 Resin (~10 years ECO)</div>
              </button>
              <button className="w-full p-4 rounded-xl bg-[#0a0a0a] border border-[#333] hover:border-[#00ff9d] transition text-left">
                <div className="font-bold">0.10 SOL</div>
                <div className="text-gray-500 text-sm">8,800 Resin (~4 years ECO)</div>
              </button>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsTopUpOpen(false)}
                className="flex-1 py-3 rounded-xl border border-[#333] hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 rounded-xl bg-[#00ff9d] text-black font-bold">
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
