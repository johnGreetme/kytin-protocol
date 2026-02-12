'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface HeartbeatPulseProps {
  isActive?: boolean;
  resinRemaining?: number;
  lastSignature?: string;
  onPulse?: () => void;
}

export function HeartbeatPulse({ 
  isActive = true, 
  resinRemaining,
  lastSignature,
  onPulse 
}: HeartbeatPulseProps) {
  return (
    <div className="relative flex flex-col items-center p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-cyan-400" />
        <span className="text-sm font-medium text-zinc-400">HEARTBEAT</span>
      </div>

      {/* ECG Line Animation */}
      <div className="relative w-full h-24 overflow-hidden">
        {/* Background Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px',
          }}
        />

        {/* ECG Line */}
        {isActive && (
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 200 50" 
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,25 L40,25 L45,25 L50,10 L55,40 L60,25 L65,25 L70,25 L75,20 L80,30 L85,25 L100,25 L140,25 L145,25 L150,10 L155,40 L160,25 L165,25 L170,25 L175,20 L180,30 L185,25 L200,25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-cyan-400"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.5))',
              }}
            />
          </svg>
        )}

        {/* Flatline when inactive */}
        {!isActive && (
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 200 50" 
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="25"
              x2="200"
              y2="25"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-red-500"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))',
              }}
            />
          </svg>
        )}
      </div>

      {/* Pulse Button */}
      <motion.button
        onClick={onPulse}
        disabled={!isActive}
        className={`mt-6 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
          isActive 
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/25'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
        }`}
        whileHover={isActive ? { scale: 1.05 } : {}}
        whileTap={isActive ? { scale: 0.95 } : {}}
      >
        {isActive ? '💓 Send Heartbeat' : '💀 Agent Dead'}
      </motion.button>

      {/* Stats */}
      {resinRemaining !== undefined && (
        <div className="mt-4 text-center">
          <p className="text-xs text-zinc-500">Resin after pulse</p>
          <p className="text-lg font-mono text-cyan-400">{resinRemaining.toLocaleString()}</p>
        </div>
      )}

      {/* Last Signature (truncated) */}
      {lastSignature && (
        <div className="mt-4 w-full">
          <p className="text-xs text-zinc-500 mb-1">Last Signature</p>
          <div className="px-3 py-2 bg-zinc-800/50 rounded-lg overflow-hidden">
            <p className="text-xs font-mono text-zinc-400 truncate">
              {lastSignature}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
