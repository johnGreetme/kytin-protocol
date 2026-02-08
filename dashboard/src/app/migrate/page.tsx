'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, ArrowLeft, AlertTriangle, CheckCircle, Key, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { kytinAPI, AgentDeadError, MigrateResponse } from '@/lib/kytin-api';

type Step = 'detect' | 'input' | 'confirm' | 'execute' | 'complete';

export default function MigratePage() {
  const [step, setStep] = useState<Step>('detect');
  const [hardwareId, setHardwareId] = useState<string | null>(null);
  const [childKey, setChildKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MigrateResponse | null>(null);
  const [isShattered, setIsShattered] = useState(false);

  // Detect local Sentinel
  const detectSentinel = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await kytinAPI.getStatus();
      setHardwareId(status.tpm.hardware_id);
      setStep('input');
    } catch (e) {
      if (e instanceof AgentDeadError) {
        setError('This Sentinel is already dead. Soul Transfer was previously executed.');
      } else {
        setError('Cannot connect to local Sentinel. Is it running on port 18789?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Soul Transfer
  const executeMigration = async () => {
    if (!childKey) {
      setError('Child public key is required');
      return;
    }

    setStep('execute');
    setIsLoading(true);
    setError(null);

    try {
      const response = await kytinAPI.migrate(childKey);
      setResult(response);
      
      // Trigger shatter animation
      setIsShattered(true);
      
      setTimeout(() => {
        setStep('complete');
      }, 2000);
    } catch (e) {
      if (e instanceof AgentDeadError) {
        setError('This Sentinel is already dead.');
      } else if (e instanceof Error) {
        setError(e.message);
      }
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Shatter Overlay */}
      <AnimatePresence>
        {isShattered && (
          <motion.div
            className="fixed inset-0 z-50 bg-red-900/90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 0.5 }}
              >
                <Skull className="w-24 h-24 text-red-300 mx-auto" />
              </motion.div>
              <h1 className="text-4xl font-bold text-red-200 mt-6">SYSTEM TERMINATED</h1>
              <p className="text-red-300 mt-2">Soul Transfer Complete</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Mission Control</span>
          </Link>
          <div className="flex items-center gap-2 text-red-400">
            <Skull className="w-5 h-5" />
            <span className="text-sm font-medium">SOUL TRANSFER</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Warning Banner */}
        <motion.div
          className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-400">IRREVERSIBLE ACTION</h3>
            <p className="text-sm text-red-300/80 mt-1">
              Soul Transfer permanently terminates this Sentinel. All future signing requests 
              will fail with 410 GONE. Authority will transfer cryptographically to the child key.
            </p>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1: Detect */}
          <motion.div
            className={`p-6 rounded-2xl border ${
              step === 'detect' ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'detect' ? 'bg-emerald-500' :
                hardwareId ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}>
                {hardwareId ? <CheckCircle className="w-4 h-4 text-white" /> : '1'}
              </div>
              <h2 className="text-lg font-semibold">Detect Parent Sentinel</h2>
            </div>

            {step === 'detect' && (
              <div className="ml-11">
                <p className="text-sm text-zinc-400 mb-4">
                  Connect to your local Sentinel to begin the migration process.
                </p>
                <button
                  onClick={detectSentinel}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-medium text-sm hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {isLoading ? 'Detecting...' : 'Detect Sentinel'}
                </button>
              </div>
            )}

            {hardwareId && (
              <div className="ml-11 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-xs text-emerald-400 mb-1">PARENT HARDWARE ID</p>
                <p className="font-mono text-emerald-300">{hardwareId}</p>
              </div>
            )}
          </motion.div>

          {/* Step 2: Input Child Key */}
          <motion.div
            className={`p-6 rounded-2xl border ${
              step === 'input' ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800'
            } ${!hardwareId ? 'opacity-50' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'input' ? 'bg-cyan-500' :
                childKey ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}>
                {childKey && step !== 'input' ? <CheckCircle className="w-4 h-4 text-white" /> : '2'}
              </div>
              <h2 className="text-lg font-semibold">Enter Child Identity</h2>
            </div>

            {step === 'input' && (
              <div className="ml-11">
                <p className="text-sm text-zinc-400 mb-4">
                  Enter the public key from your new machine (generated with <code className="text-cyan-400">npx kytin-migrate --receive</code>).
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">CHILD PUBLIC KEY</label>
                    <input
                      type="text"
                      value={childKey}
                      onChange={(e) => setChildKey(e.target.value)}
                      placeholder="Enter child public key..."
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={!childKey}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium text-sm hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Continue
                  </button>
                </div>
              </div>
            )}

            {childKey && step !== 'input' && (
              <div className="ml-11 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-xs text-cyan-400 mb-1">CHILD PUBLIC KEY</p>
                <p className="font-mono text-cyan-300 text-sm break-all">{childKey}</p>
              </div>
            )}
          </motion.div>

          {/* Step 3: Confirm */}
          <motion.div
            className={`p-6 rounded-2xl border ${
              step === 'confirm' ? 'bg-zinc-900 border-red-500/50' : 'bg-zinc-900/50 border-zinc-800'
            } ${!childKey ? 'opacity-50' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirm' ? 'bg-red-500' :
                result ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}>
                {result ? <CheckCircle className="w-4 h-4 text-white" /> : '3'}
              </div>
              <h2 className="text-lg font-semibold text-red-400">Execute Kill Switch</h2>
            </div>

            {step === 'confirm' && (
              <div className="ml-11">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <p className="text-sm text-red-300">
                    ⚠️ <strong>FINAL WARNING:</strong> Clicking the button below will:
                  </p>
                  <ul className="text-sm text-red-300/80 mt-2 ml-4 list-disc space-y-1">
                    <li>Sign a "Death Certificate" with your TPM</li>
                    <li>Permanently disable this Sentinel</li>
                    <li>Transfer authority to the child key</li>
                    <li>This action is <strong>IRREVERSIBLE</strong></li>
                  </ul>
                </div>
                
                <button
                  onClick={executeMigration}
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 rounded-xl font-bold text-lg hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-red-500/25"
                >
                  <Skull className="w-5 h-5" />
                  {isLoading ? 'EXECUTING...' : '☠️ TERMINATE SENTINEL'}
                </button>
              </div>
            )}
          </motion.div>

          {/* Step 4: Complete */}
          {step === 'complete' && result && (
            <motion.div
              className="p-6 rounded-2xl border bg-zinc-900 border-emerald-500/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-emerald-400">Soul Transfer Complete</h2>
              </div>

              <div className="ml-11 space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-emerald-300">
                    ✅ The migration signature has been generated. Copy this to your new machine to complete the resurrection.
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 mb-1">LAST WILL SIGNATURE</p>
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <code className="text-xs text-amber-400 break-all">{result.last_will_signature}</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">PARENT</p>
                    <p className="font-mono text-sm text-red-400">{result.parent_pubkey}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">CHILD</p>
                    <p className="font-mono text-sm text-emerald-400 truncate">{result.child_key}</p>
                  </div>
                </div>

                <Link
                  href="/"
                  className="block w-full text-center px-6 py-3 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Return to Mission Control
                </Link>
              </div>
            </motion.div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
