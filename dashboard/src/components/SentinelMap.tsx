'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Skull, Wifi, WifiOff, Zap } from 'lucide-react';
import { AgentState } from '@/lib/kytin-api';

interface SentinelMapProps {
  state: AgentState;
  hardwareId?: string;
  childKey?: string;
  lastWillSignature?: string;
}

export function SentinelMap({ 
  state, 
  hardwareId,
  childKey,
  lastWillSignature 
}: SentinelMapProps) {
  return (
    <div className="relative w-full h-80 bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radar Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-zinc-700/30"
            style={{
              width: `${ring * 80}px`,
              height: `${ring * 80}px`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 3,
              delay: ring * 0.5,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Status Label */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          state === 'online' ? 'bg-emerald-500' :
          state === 'dead' ? 'bg-red-500' :
          'bg-zinc-500'
        }`} />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {state === 'online' ? 'ACTIVE SENTINEL' :
           state === 'dead' ? 'AGENT DECEASED' :
           'OFFLINE'}
        </span>
      </div>

      {/* Hardware ID */}
      {hardwareId && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-zinc-800/50 rounded-full">
          <span className="text-xs font-mono text-zinc-500">{hardwareId}</span>
        </div>
      )}

      {/* Center Agent Marker */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {state === 'online' && (
            <motion.div
              key="online"
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {/* Pulse Ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-500/20"
                style={{ width: 80, height: 80, left: -28, top: -28 }}
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              
              {/* Main Dot */}
              <motion.div
                className="relative w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(16, 185, 129, 0.5)',
                    '0 0 40px rgba(16, 185, 129, 0.8)',
                    '0 0 20px rgba(16, 185, 129, 0.5)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>
          )}

          {state === 'dead' && (
            <motion.div
              key="dead"
              className="relative flex flex-col items-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
            >
              {/* Skull Icon */}
              <motion.div
                className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500"
                animate={{
                  borderColor: ['rgb(239, 68, 68)', 'rgb(127, 29, 29)', 'rgb(239, 68, 68)'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Skull className="w-8 h-8 text-red-500" />
              </motion.div>
              
              {/* Death Message */}
              <motion.p
                className="mt-4 text-xs text-red-400 font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                SOUL TRANSFERRED
              </motion.p>
              
              {/* Child Key Info */}
              {childKey && (
                <motion.div
                  className="mt-2 px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/30"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-xs text-red-300">
                    Successor: <span className="font-mono">{childKey.substring(0, 20)}...</span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {state === 'offline' && (
            <motion.div
              key="offline"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-600"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <WifiOff className="w-8 h-8 text-zinc-500" />
              </motion.div>
              <p className="mt-4 text-xs text-zinc-500">NO CONNECTION</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 to-transparent">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>State-Locked Protocol™</span>
          <span>Kytin v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
