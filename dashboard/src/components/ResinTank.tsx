'use client';

import { motion } from 'framer-motion';
import { Fuel, Droplet, AlertTriangle } from 'lucide-react';

interface ResinTankProps {
  balance: number;
  maxBalance?: number;
  lifetime_burned?: number;
  isAnimating?: boolean;
}

export function ResinTank({ 
  balance, 
  maxBalance = 22000, 
  lifetime_burned = 0,
  isAnimating = false 
}: ResinTankProps) {
  const percentage = Math.min(100, (balance / maxBalance) * 100);
  const isLow = percentage < 10;
  const isCritical = percentage < 5;

  // Color based on level
  const getColor = () => {
    if (isCritical) return { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' };
    if (isLow) return { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' };
    return { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' };
  };

  const colors = getColor();

  return (
    <div className="relative flex flex-col items-center p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <Fuel className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-medium text-zinc-400">RESIN TANK</span>
      </div>

      {/* Circular Gauge */}
      <div className="relative w-40 h-40">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-zinc-800"
          />
          
          {/* Animated Progress Circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={colors.primary}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.83} 283`}
            initial={{ strokeDasharray: '0 283' }}
            animate={{ 
              strokeDasharray: `${percentage * 2.83} 283`,
              filter: isAnimating ? `drop-shadow(0 0 10px ${colors.glow})` : 'none'
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="flex items-center gap-1"
            animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Droplet 
              className="w-5 h-5" 
              style={{ color: colors.primary }}
            />
            <motion.span 
              className="text-3xl font-bold text-white"
              key={balance}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {balance.toLocaleString()}
            </motion.span>
          </motion.div>
          <span className="text-xs text-zinc-500 mt-1">CREDITS</span>
        </div>

        {/* Warning Icon for Low */}
        {isLow && (
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 w-full text-center">
        <div>
          <p className="text-xs text-zinc-500">FILL</p>
          <p className="text-lg font-semibold text-white">{percentage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">BURNED</p>
          <p className="text-lg font-semibold text-zinc-400">{lifetime_burned.toLocaleString()}</p>
        </div>
      </div>

      {/* Refill Link */}
      {isLow && (
        <motion.a
          href="https://clawhub.kytin.io/refill"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          🔥 Refill Resin
        </motion.a>
      )}
    </div>
  );
}
