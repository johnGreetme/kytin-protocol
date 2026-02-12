'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Shield, Zap, Search, Filter } from 'lucide-react';
import Link from 'next/link';

// Mock sentinel data for the explorer
const MOCK_SENTINELS = [
  { id: 1, lat: 37.7749, lng: -122.4194, tier: 'SOVEREIGN', city: 'San Francisco', uptime: 998, resin: 21450 },
  { id: 2, lat: 40.7128, lng: -74.0060, tier: 'SOVEREIGN', city: 'New York', uptime: 985, resin: 18200 },
  { id: 3, lat: 51.5074, lng: -0.1278, tier: 'SENTINEL', city: 'London', uptime: 890, resin: 5600 },
  { id: 4, lat: 35.6762, lng: 139.6503, tier: 'SOVEREIGN', city: 'Tokyo', uptime: 995, resin: 19800 },
  { id: 5, lat: 1.3521, lng: 103.8198, tier: 'SILICON', city: 'Singapore', uptime: 450, resin: 0 },
  { id: 6, lat: -33.8688, lng: 151.2093, tier: 'SENTINEL', city: 'Sydney', uptime: 780, resin: 3200 },
  { id: 7, lat: 48.8566, lng: 2.3522, tier: 'SOVEREIGN', city: 'Paris', uptime: 920, resin: 15600 },
  { id: 8, lat: 52.5200, lng: 13.4050, tier: 'SENTINEL', city: 'Berlin', uptime: 856, resin: 8900 },
];

type Tier = 'GHOST' | 'SILICON' | 'SENTINEL' | 'SOVEREIGN';

const TIER_COLORS: Record<Tier, string> = {
  GHOST: '#6b7280',
  SILICON: '#eab308',
  SENTINEL: '#3b82f6',
  SOVEREIGN: '#00ff9d',
};

export default function ExplorerPage() {
  const [selectedTier, setSelectedTier] = useState<Tier | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSentinels = MOCK_SENTINELS.filter(s => {
    if (selectedTier !== 'ALL' && s.tier !== selectedTier) return false;
    if (searchQuery && !s.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: MOCK_SENTINELS.length,
    sovereign: MOCK_SENTINELS.filter(s => s.tier === 'SOVEREIGN').length,
    sentinel: MOCK_SENTINELS.filter(s => s.tier === 'SENTINEL').length,
    silicon: MOCK_SENTINELS.filter(s => s.tier === 'SILICON').length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00ff9d]">Global Explorer</h1>
            <p className="text-gray-500">Active Kytin Sentinels Worldwide</p>
          </div>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Dashboard</Link>
            <Link href="/explorer" className="px-4 py-2 rounded-lg bg-[#00ff9d]/20 text-[#00ff9d]">Explorer</Link>
            <Link href="/recovery" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Recovery</Link>
          </nav>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] rounded-xl p-6 border border-[#222]"
          >
            <div className="text-gray-500 text-sm mb-1">Total Nodes</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111] rounded-xl p-6 border border-[#222]"
          >
            <div className="text-gray-500 text-sm mb-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff9d]" />
              Sovereign
            </div>
            <div className="text-3xl font-bold text-[#00ff9d]">{stats.sovereign}</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111] rounded-xl p-6 border border-[#222]"
          >
            <div className="text-gray-500 text-sm mb-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
              Sentinel
            </div>
            <div className="text-3xl font-bold text-[#3b82f6]">{stats.sentinel}</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111] rounded-xl p-6 border border-[#222]"
          >
            <div className="text-gray-500 text-sm mb-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#eab308]" />
              Silicon
            </div>
            <div className="text-3xl font-bold text-[#eab308]">{stats.silicon}</div>
          </motion.div>
        </div>

        {/* Map Placeholder + Node List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-[#111] rounded-2xl border border-[#222] overflow-hidden relative"
            style={{ minHeight: '500px' }}
          >
            {/* Dark Map Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#151515]">
              {/* Grid overlay */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}
              />
              
              {/* Glowing dots for nodes */}
              {filteredSentinels.map((node) => {
                // Simple projection for demo
                const x = ((node.lng + 180) / 360) * 100;
                const y = ((90 - node.lat) / 180) * 100;
                
                return (
                  <motion.div
                    key={node.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full animate-pulse"
                      style={{ 
                        backgroundColor: TIER_COLORS[node.tier as Tier],
                        boxShadow: `0 0 20px ${TIER_COLORS[node.tier as Tier]}`,
                      }}
                    />
                  </motion.div>
                );
              })}

              {/* Map Label */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-gray-500">
                <Globe size={20} />
                <span className="text-sm">Interactive map coming soon (Mapbox GL)</span>
              </div>
            </div>
          </motion.div>

          {/* Node List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111] rounded-2xl p-6 border border-[#222]"
          >
            {/* Search & Filter */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-[#00ff9d] outline-none transition"
                />
              </div>
              <button className="p-2 bg-[#0a0a0a] border border-[#333] rounded-lg hover:border-[#00ff9d] transition">
                <Filter size={18} />
              </button>
            </div>

            {/* Tier Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {(['ALL', 'SOVEREIGN', 'SENTINEL', 'SILICON'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-3 py-1 rounded-full text-xs transition ${
                    selectedTier === tier
                      ? 'bg-[#00ff9d] text-black'
                      : 'bg-[#0a0a0a] border border-[#333] hover:border-[#00ff9d]'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Node List */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {filteredSentinels.map((node) => (
                <motion.div
                  key={node.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-[#0a0a0a] rounded-xl border border-[#222] hover:border-[#00ff9d]/50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{node.city}</span>
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ 
                        backgroundColor: `${TIER_COLORS[node.tier as Tier]}20`,
                        color: TIER_COLORS[node.tier as Tier]
                      }}
                    >
                      {node.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Shield size={14} />
                      {node.uptime}/1000
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={14} />
                      {node.resin.toLocaleString()} Resin
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
