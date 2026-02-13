'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Globe, Cpu, Shield, Zap, Map as MapIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Mock Data
const MOCK_NODES = [
  { id: 'SF-01', city: 'San Francisco', type: 'SOVEREIGN', status: 'online', resin: 21450, capacity: 1000 },
  { id: 'NY-02', city: 'New York', type: 'SOVEREIGN', status: 'online', resin: 18200, capacity: 1000 },
  { id: 'LDN-03', city: 'London', type: 'SENTINEL', status: 'online', resin: 5600, capacity: 1000 },
  { id: 'TYO-04', city: 'Tokyo', type: 'SOVEREIGN', status: 'online', resin: 12000, capacity: 1000 },
  { id: 'BER-05', city: 'Berlin', type: 'SENTINEL', status: 'offline', resin: 0, capacity: 1000 },
  { id: 'SIN-06', city: 'Singapore', type: 'SILICON', status: 'online', resin: 8900, capacity: 1000 },
  { id: 'TOR-07', city: 'Toronto', type: 'SENTINEL', status: 'online', resin: 4200, capacity: 1000 },
  { id: 'SYD-08', city: 'Sydney', type: 'SOVEREIGN', status: 'online', resin: 15500, capacity: 1000 },
];

export default function ExplorerPage() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredNodes = MOCK_NODES.filter(node => {
    const matchesFilter = filter === 'ALL' || node.type === filter;
    const matchesSearch = node.city.toLowerCase().includes(search.toLowerCase()) || 
                          node.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: MOCK_NODES.length,
    sovereign: MOCK_NODES.filter(n => n.type === 'SOVEREIGN').length,
    sentinel: MOCK_NODES.filter(n => n.type === 'SENTINEL').length,
    silicon: MOCK_NODES.filter(n => n.type === 'SILICON').length,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="border-b border-zinc-900 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Global Explorer
            </h1>
            <p className="text-xs text-zinc-500">Active Kytin Sentinels Worldwide</p>
          </div>

          <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
            <Link href="/" className="px-4 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800">
              Dashboard
            </Link>
            <span className="px-4 py-1.5 text-sm text-emerald-400 bg-zinc-800 rounded-md font-medium shadow-sm">
              Explorer
            </span>
            <Link href="/recovery" className="px-4 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800">
              Recovery
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Nodes" value={stats.total} color="text-white" />
          <StatsCard label="Sovereign" value={stats.sovereign} color="text-emerald-400" dotColor="bg-emerald-400" />
          <StatsCard label="Sentinel" value={stats.sentinel} color="text-blue-400" dotColor="bg-blue-400" />
          <StatsCard label="Silicon" value={stats.silicon} color="text-amber-400" dotColor="bg-amber-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-240px)] min-h-[600px]">
          
          {/* Map Area (2/3 width) */}
          <div className="lg:col-span-2 bg-[#0a0a0a] rounded-2xl border border-zinc-800 relative overflow-hidden group">
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
            
            {/* World Map Placeholder (Abstract) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
               <Globe className="w-96 h-96 text-zinc-600" strokeWidth={0.5} />
            </div>

            {/* Nodes on Map (Simulated Positions) */}
            {MOCK_NODES.map((node, i) => (
              <MapNode key={node.id} node={node} index={i} />
            ))}

            <div className="absolute bottom-6 left-6 flex items-center gap-2 text-zinc-500 text-xs">
              <Globe className="w-4 h-4" />
              <span>Interactive map coming soon (Mapbox GL)</span>
            </div>
          </div>

          {/* Sidebar (1/3 width) */}
          <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
            
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-zinc-800 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search city..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded">
                  <Filter className="w-3 h-3 text-zinc-500" />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <FilterChip label="ALL" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                <FilterChip label="SOVEREIGN" active={filter === 'SOVEREIGN'} onClick={() => setFilter('SOVEREIGN')} />
                <FilterChip label="SENTINEL" active={filter === 'SENTINEL'} onClick={() => setFilter('SENTINEL')} />
                <FilterChip label="SILICON" active={filter === 'SILICON'} onClick={() => setFilter('SILICON')} />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredNodes.map(node => (
                <div key={node.id} className="p-3 rounded-lg hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{node.city}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs text-zinc-500 font-mono">{node.capacity}/1000</span>
                      </div>
                    </div>
                    <Badge type={node.type} />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-900 group-hover:border-zinc-800">
                    <span className="font-mono">{node.id}</span>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Zap className="w-3 h-3" />
                      {node.resin.toLocaleString()} Resin
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components

function StatsCard({ label, value, color, dotColor }: { label: string, value: number, color: string, dotColor?: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl flex flex-col justify-between h-24 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-1 z-10">
        {dotColor && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${color} z-10`}>
        {value}
      </div>
      {/* Subtle Glow */}
      <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-5 blur-xl ${dotColor || 'bg-white'}`} />
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all border ${
        active 
          ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
          : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ type }: { type: string }) {
  const styles = {
    SOVEREIGN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SENTINEL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SILICON: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[type as keyof typeof styles] || styles.SOVEREIGN}`}>
      {type}
    </span>
  );
}

function MapNode({ node, index }: { node: any, index: number }) {
  // Random positions for demo
  const positions = [
    { top: '40%', left: '20%' }, // SF
    { top: '38%', left: '28%' }, // NY
    { top: '35%', left: '48%' }, // London
    { top: '42%', left: '85%' }, // Tokyo
    { top: '36%', left: '52%' }, // Berlin
    { top: '55%', left: '75%' }, // Singapore
    { top: '36%', left: '26%' }, // Toronto
    { top: '75%', left: '88%' }, // Sydney
  ];
  
  const pos = positions[index] || { top: '50%', left: '50%' };
  
  const colors = {
    SOVEREIGN: 'bg-emerald-500 shadow-[0_0_20px_2px_rgba(16,185,129,0.8)] ring-2 ring-emerald-500/30',
    SENTINEL: 'bg-blue-500 shadow-[0_0_20px_2px_rgba(59,130,246,0.8)] ring-2 ring-blue-500/30',
    SILICON: 'bg-amber-500 shadow-[0_0_20px_2px_rgba(234,179,8,0.8)] ring-2 ring-amber-500/30',
    OFFLINE: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
  };

  const colorClass = node.status === 'offline' ? colors.OFFLINE : colors[node.type as keyof typeof colors];

  return (
    <motion.div
      className={`absolute w-3 h-3 rounded-full ${colorClass} cursor-pointer hover:scale-150 transition-transform z-10`}
      style={{ top: pos.top, left: pos.left }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.5 }}
    >
        {node.status === 'online' && (
            <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${colorClass.split(' ')[0]}`} />
        )}
    </motion.div>
  );
}
