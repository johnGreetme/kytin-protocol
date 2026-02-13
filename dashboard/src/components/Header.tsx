'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  activePage: 'dashboard' | 'explorer' | 'recovery';
}

export function Header({ title, subtitle, activePage }: HeaderProps) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnect = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress('');
    } else {
      setWalletConnected(true);
      setWalletAddress('8A3F...D47B'); // Mock address matching the design's Identity Card
    }
  };

  const navLinkClass = (page: string) => 
    `px-5 py-2 text-sm transition-colors rounded-md font-medium ${
      activePage === page 
        ? 'text-emerald-400 bg-zinc-800 shadow-sm' 
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    }`;

  return (
    <header className="border-b border-zinc-900/50 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Title Area */}
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${
            activePage === 'explorer' 
              ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent'
              : 'text-emerald-500'
          }`}>
            {title}
          </h1>
          <p className="text-xs text-zinc-500 font-medium">{subtitle}</p>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 absolute left-1/2 -translate-x-1/2">
          <Link href="/dashboard" className={navLinkClass('dashboard')}>
            Dashboard
          </Link>
          <Link href="/explorer" className={navLinkClass('explorer')}>
            Explorer
          </Link>
          <Link href="/recovery" className={navLinkClass('recovery')}>
            Recovery
          </Link>
        </nav>

        {/* Right Area: Wallet Connection */}
        <div className="flex items-center gap-4">
            <button
                onClick={handleConnect}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    walletConnected 
                        ? 'bg-zinc-900 text-emerald-400 border-zinc-700 hover:border-red-900/50 hover:bg-red-900/10 hover:text-red-400'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                }`}
            >
                {walletConnected ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono">{walletAddress}</span>
                        {/* Hover reveal for disconnect could act here, simpler for now just standard button */}
                    </>
                ) : (
                    <>
                        <Wallet className="w-4 h-4" />
                        <span>Connect Wallet</span>
                    </>
                )}
            </button>
        </div>

      </div>
    </header>
  );
}
