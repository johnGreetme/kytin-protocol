'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Wallet, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';

export default function RecoveryPage() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      <Header 
        title="Lazarus Protocol" 
        subtitle="Disaster Recovery for Dead Hardware" 
        activePage="recovery" 
      />

      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Warning Banner */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 mb-12 flex gap-4 items-start">
           <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
             <AlertTriangle className="w-6 h-6 text-amber-500" />
           </div>
           <div>
             <h3 className="text-amber-500 font-bold mb-1">Emergency Recovery Only</h3>
             <p className="text-sm text-zinc-400 leading-relaxed">
               This protocol is for hardware failure scenarios where your TPM cannot sign a standard migration. 
               You must have your <strong className="text-zinc-200">Recovery Wallet</strong> (e.g., Ledger) connected to proceed.
             </p>
           </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-16 relative">
           {/* Connecting Line */}
           <div className="absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-zinc-800 -z-10" />
           
           <div className="flex justify-between w-full max-w-md">
              <Step number={1} active={activeStep >= 1} current={activeStep === 1} />
              <Step number={2} active={activeStep >= 2} current={activeStep === 2} />
              <Step number={3} active={activeStep >= 3} current={activeStep === 3} />
           </div>
        </div>

        {/* Step Content */}
        <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-800 p-8 md:p-12">
           
           <div className="flex items-center gap-3 mb-6">
             <Wallet className="w-6 h-6 text-emerald-500" />
             <h2 className="text-xl font-bold text-white">Step 1: Connect Recovery Wallet</h2>
           </div>

           <p className="text-zinc-400 mb-8 max-w-lg">
             Connect the wallet you designated as your <strong className="text-white">Recovery Authority</strong> during initial setup. 
             This is typically a hardware wallet like Ledger.
           </p>

           <div className="space-y-4 mb-8">
              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all group text-left">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <ShieldCheck className="w-4 h-4" />
                   </div>
                   <span className="font-medium text-white">Connect Phantom</span>
                 </div>
                 <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800 hover:border-zinc-700 transition-all group text-left opacity-75 hover:opacity-100">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                     <ShieldCheck className="w-4 h-4" />
                   </div>
                   <span className="font-medium text-white">Connect Ledger</span>
                 </div>
                 <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
              </button>
           </div>

           <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
             Continue with Phantom (Demo)
           </button>

        </div>

      </main>
    </div>
  );
}

function Step({ number, active, current }: { number: number, active: boolean, current: boolean }) {
  return (
    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-500 ${
      active ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
    }`}>
      {current ? number : (active ? <CheckCircle2 className="w-5 h-5" /> : number)}
      
      {/* Label (Optional) */}
      {/* <span className="absolute -bottom-6 text-xs text-zinc-500 whitespace-nowrap">Step {number}</span> */}
    </div>
  );
}
