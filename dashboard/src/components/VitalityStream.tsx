'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Activity } from 'lucide-react';

const RPC_URL = 'https://api.devnet.solana.com';
const WSS_URL = 'wss://api.devnet.solana.com';

// P-wave (small up), Q (small down), R (huge up), S (huge down), T (medium up)
const HEARTBEAT_PATTERN = [
  -5, -10, -5, 0, // P
  0, 5, 10,     // Q
  -50, -80, -30, // R (Spike)
  20, 40, 10,    // S
  -10, -15, -10, 0 // T
];

interface VitalityStreamProps {
  walletAddress: string;
  onPulse?: () => void;
}

export function VitalityStream({ walletAddress, onPulse }: VitalityStreamProps) {
  // State Types
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 1. Hooks (Order matters)
  const [isConnected, setIsConnected] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [lastPulseTime, setLastPulseTime] = useState<number>(0); // 0 initially to avoid hydration mismatch
  const [isFlatlined, setIsFlatlined] = useState(false);

  // EKG Refs
  const dataPoints = useRef<number[]>([]);
  const frameId = useRef<number>(0);
  const pulseQueue = useRef<number[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);

  // 2. Audio Logic
  const playBeep = useCallback(() => {
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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignore audio errors (user interaction required)
    }
  }, []);

  // 3. Pulse Logic
  const triggerPulse = useCallback(() => {
    setPulseCount(c => c + 1);
    setIsPulsing(true);
    pulseQueue.current = [...HEARTBEAT_PATTERN];
    
    playBeep();

    if (onPulse) onPulse();
    
    setLastPulseTime(Date.now());
    setTimeout(() => setIsPulsing(false), 1000); 
  }, [onPulse, playBeep]);

  // 4. Initialize on Mount
  useEffect(() => {
    setLastPulseTime(Date.now());
  }, []);

  // 5. Flatline Checker
  useEffect(() => {
    const interval = setInterval(() => {
        // If connected and no pulse for > 15s
        if (isConnected && Date.now() - lastPulseTime > 15000) {
            setIsFlatlined(true);
        } else {
            setIsFlatlined(false);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPulseTime, isConnected]);

  // 6. Solana Listener
  useEffect(() => {
    if (!walletAddress) return;

    let subId: number | null = null;
    const connection = new Connection(RPC_URL, { wsEndpoint: WSS_URL });
    let pubkey: PublicKey;

    try {
      pubkey = new PublicKey(walletAddress);
    } catch (e) {
      console.error("Invalid key for stream", e);
      return;
    }

    console.log(`[VITALITY] Listening to ${walletAddress}...`);
    setIsConnected(true);
    setLastPulseTime(Date.now()); 

    subId = connection.onLogs(
      pubkey,
      (logs, ctx) => {
        if (logs.err) return; 
        console.log("[VITALITY] Pulse detected!", logs.signature);
        triggerPulse();
      },
      "confirmed"
    );

    return () => {
      if (subId !== null) connection.removeOnLogsListener(subId);
      setIsConnected(false);
    };
  }, [walletAddress, triggerPulse]);

  // 7. Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas fidelity
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    // Fill initial buffer with baseline
    if (dataPoints.current.length === 0) {
      dataPoints.current = new Array(Math.ceil(width / 2)).fill(0);
    }

    const render = () => {
      // 1. Generate Next Point
      let nextY = 0;

      // Check Queue (Pulse)
      if (pulseQueue.current.length > 0) {
        nextY = pulseQueue.current.shift()!;
      } else {
        // Resting Noise (jitters between -2 and 2)
        nextY = (Math.random() - 0.5) * 4;
      }

      // Add to data (Head)
      dataPoints.current.push(nextY);
      // Remove tail (keep fixed length)
      if (dataPoints.current.length > width / 2) {
        dataPoints.current.shift();
      }

      // 2. Clear Screen
      ctx.clearRect(0, 0, width, height);

      // 3. Draw EKG Line
      ctx.beginPath();
      ctx.strokeStyle = '#00ff9d'; // Neon Green
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff9d';
      ctx.lineJoin = 'round';

      const step = 2; // Pixels per data point
      const len = dataPoints.current.length;
      
      for (let i = 0; i < len; i++) {
        const x = i * step; 
        const pointY = dataPoints.current[i];
        const drawX = x; 
        const drawY = centerY + pointY;
        
        if (i === 0) {
          ctx.moveTo(drawX, drawY);
        } else {
          ctx.lineTo(drawX, drawY);
        }
      }
      ctx.stroke();

      // 4. Scanline / Leading Dot (The "Head")
      const lastX = (len - 1) * step;
      const lastY = centerY + dataPoints.current[len-1];
      
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fff';
      ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
      ctx.fill();

      frameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId.current);
    };
  }, []);

  return (
    <div className="relative w-full h-[200px] bg-[#0b0b0e] rounded-xl overflow-hidden border border-[#222] shadow-[0_0_50px_-12px_rgba(0,255,157,0.2)]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${isFlatlined ? 'text-red-500 animate-pulse' : 'text-[#00ff9d]'}`}>
            <Activity size={14} className={isPulsing ? "animate-pulse" : ""} />
            VITALITY FEED // {isConnected ? (isFlatlined ? "FLATLINING..." : "PULSE-LOCKED") : "SEARCHING..."}
        </div>
        <div className="text-[#333] text-[10px] font-mono">
           KYTIN CORE ID: {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "NULL"}
        </div>
      </div>

      <div className="absolute top-4 right-4 text-right">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Pulse Count</div>
        <div className="text-2xl font-bold text-[#00ff9d] font-mono">{String(pulseCount).padStart(5, '0')}</div>
      </div>
      
      {/* Grid Overlay for aesthetic */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(18,255,157,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>
  );
}
