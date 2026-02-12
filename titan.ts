import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors
const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let nodeProcess: ChildProcess | null = null;
let watchdogProcess: ChildProcess | null = null;
let isHibernating = false;

const prefixOutput = (data: Buffer, prefix: string, color: string) => {
    const lines = data.toString().split("\n");
    lines.forEach(line => {
        if (line.trim()) {
            console.log(`${color}${prefix}${RESET} ${line}`);
        }
    });
};

function stopProcesses(reason: string) {
    if (nodeProcess || watchdogProcess) {
        console.log(`${RED}[NETWORK] ❌ ${reason} - Hibernating Titan Node.${RESET}`);
        if (nodeProcess && !nodeProcess.killed) nodeProcess.kill();
        if (watchdogProcess && !watchdogProcess.killed) watchdogProcess.kill();
        nodeProcess = null;
        watchdogProcess = null;
        isHibernating = true;
    }
}

async function startProcesses(pubKey: string) {
    if (nodeProcess || watchdogProcess) return;
    
    console.log(`${BLUE}[SYS] 🚀 Sync Restored. Spawning Execution & Verification Layers...${RESET}\n`);
    
    nodeProcess = spawn("npx", ["ts-node", "start_node.ts"], { stdio: ["inherit", "pipe", "pipe"] });
    watchdogProcess = spawn("npx", ["ts-node", "watchdog.ts", pubKey], { stdio: ["inherit", "pipe", "pipe"] });

    nodeProcess.stdout?.on("data", (data) => prefixOutput(data, "[TITAN]   ", BLUE));
    nodeProcess.stderr?.on("data", (data) => prefixOutput(data, "[TITAN_ERR]", BLUE));

    watchdogProcess.stdout?.on("data", (data) => prefixOutput(data, "[WATCHDOG]", GREEN));
    watchdogProcess.stderr?.on("data", (data) => prefixOutput(data, "[WATCH_ERR]", GREEN));

    isHibernating = false;
}

async function main() {
    console.log("🚀 INITIALIZING KYTIN TITAN CONTROL (Resilience v1.1)...");

    const RPC_URL = "https://api.devnet.solana.com"; 
    const pubKey = "HWzSn67G3Zv9GaFDwL8SSZSbwMiEXSmfe4RsSJNovbnT"; 

    const { verifySync } = await import("./check_sync.ts");

    console.log(`[SYS] Identity: ${BLUE}${pubKey}${RESET}`);
    console.log("📡 [NETWORK] Checking internet and sync status...");

    // Pre-flight sync gate
    let synced = await verifySync(RPC_URL);
    
    while (!synced) {
        console.log(`${YELLOW}[SYNC] Catching up... Waiting for initial lock...${RESET}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        synced = await verifySync(RPC_URL);
    }

    console.log(`${GREEN}✅ [SYNC] Node is synchronized. Launching fleet...${RESET}`);
    await startProcesses(pubKey);

    // Resilience Monitoring Loop (Every 60s)
    setInterval(async () => {
        try {
            const currentSync = await verifySync(RPC_URL);
            
            if (!currentSync) {
                stopProcesses("Offline or Out-of-Sync");
            } else if (isHibernating) {
                console.log(`${GREEN}✅ Sync Restored. Resuming Heartbeats...${RESET}`);
                await startProcesses(pubKey);
            }
        } catch (error) {
            stopProcesses("Internet/RPC Connection Lost");
        }
    }, 5000); // Check every 5s for instant demo recovery

    // Lifecycle Management
    const cleanup = () => {
        console.log(`\n${RED}🛑 SHUTTING DOWN TITAN CONTROL...${RESET}`);
        if (nodeProcess && !nodeProcess.killed) nodeProcess.kill();
        if (watchdogProcess && !watchdogProcess.killed) watchdogProcess.kill();
        process.exit();
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
}

main().catch(err => {
    console.error(`${RED}FATAL ERROR:${RESET}`, err);
    process.exit(1);
});
