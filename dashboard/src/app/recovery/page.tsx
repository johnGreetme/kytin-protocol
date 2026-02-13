'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wallet, ShieldCheck, ArrowRight, CheckCircle2, Loader2, Scan, Database, RefreshCw, Key } from 'lucide-react';
import { Header } from '@/components/Header';

export default function RecoveryPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [recoveredId, setRecoveredId] = useState<string | null>(null);

  // Step 1: Handle Wallet Connection
  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate wallet handshake delay
    setTimeout(() => {
      setIsConnecting(false);
      setActiveStep(2);
      startScanning();
    }, 1500);
  };

  // Step 2: Simulate Blockchain Scan
  const startScanning = () => {
    setIsScanning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsScanning(false);
        setRecoveredId('TPM-8A3F-C921-D47B'); // Found Identity
      }
      setScanProgress(Math.min(100, progress));
    }, 200);
  };

  // Step 3: Handle Recovery Execution
  const handleRecovery = () => {
    setIsRecovering(true);
    // Simulate transaction signing and network confirmation
    setTimeout(() => {
        setIsRecovering(false);
        setIsComplete(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      <Header 
        title="Lazarus Protocol" 
        subtitle="Disaster Recovery for Dead Hardware" 
        activePage="recovery" 
      />

      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Warning Banner - Only show if not complete */}
        {!isComplete && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 mb-12 flex gap-4 items-start animate-fade-in">
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
        )}

        {/* Stepper - Hide on completion for clean look */}
        {!isComplete && (
            <div className="flex items-center justify-center mb-16 relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-zinc-800 -z-10" />
            
            <div className="flex justify-between w-full max-w-md">
                <Step number={1} active={activeStep >= 1} current={activeStep === 1} label="Connect" />
                <Step number={2} active={activeStep >= 2} current={activeStep === 2} label="Scan" />
                <Step number={3} active={activeStep >= 3} current={activeStep === 3} label="Recover" />
            </div>
            </div>
        )}

        {/* Dynamic Step Content */}
        <AnimatePresence mode="wait">
             <motion.div 
                key={isComplete ? 'complete' : activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0a0a0a] rounded-3xl border border-zinc-800 p-8 md:p-12 min-h-[400px] flex flex-col justify-center"
             >
                
                {/* STEP 1: CONNECT */}
                {activeStep === 1 && (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <Wallet className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">Step 1: Connect Recovery Wallet</h2>
                        </div>

                        <p className="text-zinc-400 mb-8 max-w-lg">
                            Connect the wallet you designated as your <strong className="text-white">Recovery Authority</strong> during initial setup. 
                            This is typically a hardware wallet like Ledger.
                        </p>

                        <div className="space-y-4 mb-8">
                            <button 
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                </div>
                                <span className="font-medium text-white">{isConnecting ? 'Connecting...' : 'Connect Phantom'}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800 hover:border-zinc-700 transition-all group text-left opacity-75 hover:opacity-100 cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-white">Connect Ledger (Coming Soon)</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 2: SCAN */}
                {activeStep === 2 && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 relative">
                            {isScanning ? (
                                <>
                                    <span className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping"></span>
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                </>
                            ) : (
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">
                            {isScanning ? 'Scanning Network...' : 'Identity Verified'}
                        </h2>
                        
                        <p className="text-zinc-400 mb-8 max-w-md">
                            {isScanning 
                                ? 'Searching the blockchain for your registered recovery hash. This may take a moment.' 
                                : `We found regisered identity ${recoveredId} linked to this recovery key.`
                            }
                        </p>

                         {/* Progress Bar during scan */}
                        {isScanning && (
                             <div className="w-full max-w-sm h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${scanProgress}%` }} />
                             </div>
                        )}

                        {/* Found Identity Card */}
                        {!isScanning && recoveredId && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4 mb-8 w-full max-w-md">
                                <div className="p-2 bg-emerald-500/20 rounded mr-2">
                                    <Database className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide">RECOVERABLE ASSET</p>
                                    <p className="text-white font-mono">{recoveredId}</p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                        )}

                         {!isScanning && (
                             <button 
                                onClick={() => setActiveStep(3)}
                                className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-2"
                             >
                                Proceed to Recovery <ArrowRight className="w-4 h-4" />
                             </button>
                         )}
                    </div>
                )}

                {/* STEP 3: RECOVER */}
                {activeStep === 3 && !isComplete && (
                    <div className="flex flex-col items-center text-center">
                         <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                            <Key className="w-10 h-10 text-amber-500" />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">Authorize Protocol Override</h2>
                        <p className="text-zinc-400 mb-8 max-w-lg">
                            You are about to sign a transaction that will <strong>invalidate your old TPM hash</strong> and provision a new ephemeral identity on this device.
                        </p>

                        <button 
                            onClick={handleRecovery}
                            disabled={isRecovering}
                            className={`w-full max-w-md py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                isRecovering 
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                            }`}
                        >
                            {isRecovering ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Broadcasting Transaction...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    Sign & Recover Identity
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* COMPLETE STATE */}
                {isComplete && (
                     <div className="flex flex-col items-center text-center py-8">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                        >
                            <CheckCircle2 className="w-12 h-12 text-black" strokeWidth={3} />
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-4">Lazarus Protocol Successful</h1>
                        <p className="text-zinc-400 mb-8 max-w-md leading-relaxed">
                            Your identity has been fully restored on this device. The previous hardware hash has been revoked from the network registry.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                            <Link href="/" className="flex-1 bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
                                Return to Mission Control
                            </Link>
                            <Link href="/explorer" className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors">
                                View on Explorer
                            </Link>
                        </div>
                     </div>
                )}

             </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}

function Step({ number, active, current, label }: { number: number, active: boolean, current: boolean, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-500 z-10 ${
        active ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
        }`}>
            {active && !current ? <CheckCircle2 className="w-5 h-5" /> : number}
        </div>
        <span className={`text-xs font-bold tracking-wider transition-colors duration-500 ${active ? 'text-emerald-500' : 'text-zinc-600'}`}>
            {label}
        </span>
    </div>
  );
}
