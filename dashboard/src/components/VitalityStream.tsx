'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

const RPC_URL = 'https://api.devnet.solana.com';
const WSS_URL = 'wss://api.devnet.solana.com';
const TITAN_BURN_MIN = 0.1;

// P-wave (small up), Q (small down), R (huge up), S (huge down), T (medium up)
const HEARTBEAT_PATTERN = [
  -5, -10, -5, 0, // P
  0, 5, 10,     // Q
  -50, -80, -30, // R (Spike)
  20, 40, 10,    // S
  -10, -15, -10, 0 // T
];

// Glitchy pattern for fraud
const FRAUD_PATTERN = [
  -20, 20, -40, 40, -10, 80, -80, 10, -5, 5
];

interface VitalityStreamProps {
  walletAddress: string;
  onPulse?: () => void;
}

// Helper
function getBurnAmountFromTx(tx: ParsedTransactionWithMeta | null): number {
  if (!tx) return 0;
  let totalBurn = 0;
  // Top-Level
  const instructions = tx.transaction?.message?.instructions || [];
  for (const ix of instructions) {
      if ('parsed' in ix && (ix.parsed as any).type === "burn") {
            const info = (ix.parsed as any).info;
           totalBurn += (info.amount / 1_000_000_000);
      }
  }
  // Inner
  const innerInstructions = tx.meta?.innerInstructions || [];
  for (const inner of innerInstructions) {
      for (const ix of inner.instructions) {
           if ('parsed' in ix && (ix.parsed as any).type === "burn") {
               const info = (ix.parsed as any).info;
               totalBurn += (info.amount / 1_000_000_000);
           }
      }
  }
  return totalBurn;
}

export function VitalityStream({ walletAddress, onPulse }: VitalityStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [lastPulseTime, setLastPulseTime] = useState<number>(0);
  const [isFlatlined, setIsFlatlined] = useState(false);
  const [isFraudulent, setIsFraudulent] = useState(false);

  // EKG Refs
  const dataPoints = useRef<number[]>([]);
  const frameId = useRef<number>(0);
  const pulseQueue = useRef<number[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);

  // Audio
  const playBeep = useCallback((isFraud: boolean = false) => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isFraud) {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      }
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isFraud ? 0.3 : 0.1));

      osc.start();
      osc.stop(ctx.currentTime + (isFraud ? 0.3 : 0.1));
    } catch (e) {}
  }, []);

  // Pulse Logic
  const triggerPulse = useCallback((fraud: boolean = false) => {
    setPulseCount(c => c + 1);
    setIsPulsing(true);
    setIsFraudulent(fraud);
    
    pulseQueue.current = fraud ? [...FRAUD_PATTERN, ...FRAUD_PATTERN] : [...HEARTBEAT_PATTERN];
    
    playBeep(fraud);

    if (onPulse) onPulse();
    
    setLastPulseTime(Date.now());
    setTimeout(() => setIsPulsing(false), 1000); 
  }, [onPulse, playBeep]);

  // Init
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLastPulseTime(Date.now()); }, []);

  // Flatline Check
  useEffect(() => {
    const interval = setInterval(() => {
        if (isConnected && Date.now() - lastPulseTime > 15000) {
            setIsFlatlined(true);
        } else {
            setIsFlatlined(false);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPulseTime, isConnected]);

  // Solana Listener
  useEffect(() => {
    if (!walletAddress) return;

    let subId: number | null = null;
    const connection = new Connection(RPC_URL, { wsEndpoint: WSS_URL });
    let pubkey: PublicKey;

    try { pubkey = new PublicKey(walletAddress); } catch (e) { return; }

    console.log(`[VITALITY] Listening to ${walletAddress}...`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsConnected(true);
    setLastPulseTime(Date.now()); 

      subId = connection.onLogs(
        pubkey,
        async (logs, _ctx) => {
          if (logs.err) return; 
          
          // 1. Fetch TX to verify Burn
          const signature = logs.signature;
          console.log("[VITALITY] Pulse detected, verifying...", signature);
          
          try {
              // We need to fetch full tx to see amounts. 
              // Note: This adds a slight delay to the visual pulse, which is fine for "Verification" feel.
              const tx = await connection.getParsedTransaction(signature, {
                  maxSupportedTransactionVersion: 0
              });
              
              const actualBurn = getBurnAmountFromTx(tx);
              
              if (actualBurn < TITAN_BURN_MIN) {
                  console.warn(`🚨 FRAUD DETECTED: Burned ${actualBurn} < ${TITAN_BURN_MIN}`);
                  triggerPulse(true); // FRAUD PULSE
              } else {
                  console.log(`✅ VALID: Burned ${actualBurn}`);
                  triggerPulse(false); // NORMAL PULSE
              }
          } catch (_e) {
              console.error("Verification failed, assuming visual pulse only");
              triggerPulse(false); // Fallback
          }
        },
        "confirmed"
      );

    return () => {
      if (subId !== null) connection.removeOnLogsListener(subId);
      setIsConnected(false);
    };
  }, [walletAddress, triggerPulse]);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    if (dataPoints.current.length === 0) {
      dataPoints.current = new Array(Math.ceil(width / 2)).fill(0);
    }

    const render = () => {
      let nextY = 0;
      if (pulseQueue.current.length > 0) {
        nextY = pulseQueue.current.shift()!;
      } else {
        // Jitter: Higher if fraud
        const noise = isFraudulent ? 8 : 4;
        nextY = (Math.random() - 0.5) * noise;
      }

      dataPoints.current.push(nextY);
      if (dataPoints.current.length > width / 2) {
        dataPoints.current.shift();
      }

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      
      // Color Logic
      const color = isFraudulent ? '#ff4b2b' : '#00ff9d';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.lineJoin = 'round';

      const step = 2;
      const len = dataPoints.current.length;
      
      for (let i = 0; i < len; i++) {
        const x = i * step; 
        const pointY = dataPoints.current[i];
        
        // Glitch effect on X axis if fraud
        const offsetX = isFraudulent && Math.random() > 0.8 ? (Math.random() - 0.5) * 10 : 0;
        
        if (i === 0) ctx.moveTo(x + offsetX, centerY + pointY);
        else ctx.lineTo(x + offsetX, centerY + pointY);
      }
      ctx.stroke();

      // Head Dot
      const lastX = (len - 1) * step;
      const lastY = centerY + dataPoints.current[len-1];
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = isFraudulent ? '#ff4b2b' : '#fff';
      ctx.arc(lastX, lastY, isFraudulent ? 4 : 2, 0, Math.PI * 2);
      ctx.fill();

      frameId.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId.current);
  }, [isFraudulent]); // Re-bind if fraud state changes



  return (
    <div className={`relative w-full h-[200px] bg-[#0b0b0e] rounded-xl overflow-hidden border transition-colors duration-300 ${isFraudulent ? 'border-red-500 fraud-mode' : 'border-[#222] shadow-[0_0_50px_-12px_rgba(0,255,157,0.2)]'}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${isFraudulent ? 'text-red-500 animate-pulse' : (isFlatlined ? 'text-red-500 animate-pulse' : 'text-[#00ff9d]')}`}>
            {isFraudulent ? <ShieldAlert size={14} /> : <Activity size={14} className={isPulsing ? "animate-pulse" : ""} />}
            
            {isFraudulent ? "SECURITY BREACH: FRAUD DETECTED" : 
             (isConnected ? (isFlatlined ? "FLATLINING..." : "PULSE-LOCKED") : "SEARCHING...")}
        </div>
        <div className="text-[#333] text-[10px] font-mono">
           KYTIN CORE ID: {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "NULL"}
        </div>
      </div>

      <div className="absolute top-4 right-4 text-right">
        <div className={`text-[10px] uppercase tracking-wider ${isFraudulent ? 'text-red-500' : 'text-gray-500'}`}>Pulse Count</div>
        <div className={`text-2xl font-bold font-mono ${isFraudulent ? 'text-red-500' : 'text-[#00ff9d]'}`}>{String(pulseCount).padStart(5, '0')}</div>
      </div>
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(18,255,157,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>
  );
}
