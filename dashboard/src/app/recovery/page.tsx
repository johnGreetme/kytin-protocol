'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, CheckCircle, Key, Shield, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function RecoveryPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [newTPMKey, setNewTPMKey] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleRecover = async () => {
    if (!newTPMKey) return;
    
    setIsRecovering(true);
    // Simulate recovery process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRecovering(false);
    setIsComplete(true);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-[#00ff9d]">Lazarus Protocol</h1>
          <p className="text-gray-500">Disaster Recovery for Dead Hardware</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Dashboard</Link>
          <Link href="/explorer" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Explorer</Link>
          <Link href="/recovery" className="px-4 py-2 rounded-lg bg-[#00ff9d]/20 text-[#00ff9d]">Recovery</Link>
        </nav>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8 flex items-start gap-4"
        >
          <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-yellow-500 mb-1">Emergency Recovery Only</h3>
            <p className="text-gray-400 text-sm">
              This protocol is for hardware failure scenarios where your TPM cannot sign a standard migration. 
              You must have your <strong>Recovery Wallet</strong> (e.g., Ledger) connected to proceed.
            </p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                  step >= s 
                    ? 'bg-[#00ff9d] text-black' 
                    : 'bg-[#222] text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-24 h-1 mx-2 ${step > s ? 'bg-[#00ff9d]' : 'bg-[#222]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#111] rounded-2xl p-8 border border-[#222]"
        >
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="text-[#00ff9d]" />
                <h2 className="text-xl font-semibold">Step 1: Connect Recovery Wallet</h2>
              </div>
              <p className="text-gray-400 mb-6">
                Connect the wallet you designated as your <strong>Recovery Authority</strong> during initial setup.
                This is typically a hardware wallet like Ledger.
              </p>
              
              <div className="space-y-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-4 rounded-xl bg-[#0a0a0a] border border-[#333] hover:border-[#00ff9d] transition flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#00ff9d]/20 rounded-lg flex items-center justify-center">
                      <Key className="text-[#00ff9d]" size={18} />
                    </div>
                    <span>Connect Phantom</span>
                  </span>
                  <span className="text-gray-500">→</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-4 rounded-xl bg-[#0a0a0a] border border-[#333] hover:border-[#00ff9d] transition flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="text-purple-400" size={18} />
                    </div>
                    <span>Connect Ledger</span>
                  </span>
                  <span className="text-gray-500">→</span>
                </motion.button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-xl bg-[#00ff9d] text-black font-bold"
              >
                Continue with Phantom (Demo)
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Key className="text-[#00ff9d]" />
                <h2 className="text-xl font-semibold">Step 2: Enter New TPM Public Key</h2>
              </div>
              <p className="text-gray-400 mb-6">
                On your <strong>new hardware</strong>, run <code className="bg-[#0a0a0a] px-2 py-1 rounded">npx kytin-init --keygen</code> to generate a new TPM keypair.
                Paste the Public Key below.
              </p>

              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-2">New TPM Public Key (Base58)</label>
                <input
                  type="text"
                  value={newTPMKey}
                  onChange={(e) => setNewTPMKey(e.target.value)}
                  placeholder="e.g., 7xKXtg2CnY9....."
                  className="w-full p-4 bg-[#0a0a0a] border border-[#333] rounded-xl focus:border-[#00ff9d] outline-none transition font-mono text-sm"
                />
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6">
                <div className="text-gray-500 text-xs mb-2">RECOVERY WALLET</div>
                <div className="font-mono text-sm truncate">7xKX...9fG2 (Phantom)</div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-xl border border-[#333] hover:bg-white/5 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleRecover}
                  disabled={!newTPMKey || isRecovering}
                  className="flex-1 py-4 rounded-xl bg-[#00ff9d] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      Recovering...
                    </>
                  ) : (
                    'Recover Identity'
                  )}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-[#00ff9d]/20 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="text-[#00ff9d]" size={40} />
                </motion.div>
                
                <h2 className="text-2xl font-bold mb-2">Identity Recovered!</h2>
                <p className="text-gray-400 mb-8">
                  Your agent identity has been successfully transferred to the new hardware.
                </p>

                <div className="bg-[#0a0a0a] rounded-xl p-6 text-left mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">OLD TPM</div>
                      <div className="font-mono text-red-500 line-through">TPM-8A3F...D47B</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">NEW TPM</div>
                      <div className="font-mono text-[#00ff9d]">{newTPMKey.substring(0, 12)}...</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">RESIN BALANCE</div>
                      <div className="text-white">18,450 ✓ Preserved</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">REPUTATION</div>
                      <div className="text-white">985/1000 ✓ Preserved</div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="inline-block px-8 py-4 rounded-xl bg-[#00ff9d] text-black font-bold"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-[#111] rounded-xl p-6 border border-[#222]"
        >
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Shield size={18} className="text-[#00ff9d]" />
            How Lazarus Protocol Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>1. Your agent identity is stored in a stable <strong>Program Derived Address (PDA)</strong> on Solana.</li>
            <li>2. The PDA holds your Resin, Reputation, and active contracts—not your TPM.</li>
            <li>3. When hardware dies, your Recovery Wallet can <strong>force-rotate</strong> the TPM key.</li>
            <li>4. The new hardware instantly inherits all assets. The old key is blacklisted.</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
