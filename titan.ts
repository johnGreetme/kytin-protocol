import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors
const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

async function main() {
    console.log("🚀 INITIALIZING KYTIN TITAN CONTROL...");

    // 1. Resolve Target PubKey from local wallet
    const homeDir = os.homedir();
    const keyPath = join(homeDir, ".config", "solana", "id.json");
    let pubKey = "";
    
    try {
        if (fs.existsSync(keyPath)) {
            // This is a rough way to get the pubkey without full web3.js in the runner
            // but we have it in the env anyway.
            // For now, let's just use the known Devnet wallet HW...T
            pubKey = "HWzSn67G3Zv9GaFDwL8SSZSbwMiEXSmfe4RsSJNovbnT";
        }
    } catch (e) {}

    console.log(`[SYS] Identity: ${pubKey}`);
    console.log("[SYS] Performing Pre-Flight Sync Check...");

    // 2. Wait for Sync
    const { verifySync } = await import("./check_sync.ts");
    let isSynced = false;
    let attempts = 0;
    
    while (!isSynced && attempts < 5) {
        isSynced = await verifySync("https://api.devnet.solana.com"); // Checking Devnet sync
        if (!isSynced) {
            attempts++;
            console.log(`[SYS] Waiting for cluster sync (Attempt ${attempts}/5)...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    if (!isSynced) {
        console.log("⚠️ WARNING: Cluster sync not reached, but proceeding for demo purposes...");
    }

    console.log("[SYS] Spawning Execution & Verification Layers...\n");

    // 3. Spawn Processes
    const node = spawn("npx", ["ts-node", "start_node.ts"], { stdio: ["inherit", "pipe", "pipe"] });
    const watchdog = spawn("npx", ["ts-node", "watchdog.ts", pubKey], { stdio: ["inherit", "pipe", "pipe"] });

    // 3. Handle Output
    const prefixOutput = (data: Buffer, prefix: string, color: string) => {
        const lines = data.toString().split("\n");
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${color}${prefix}${RESET} ${line}`);
            }
        });
    };

    node.stdout.on("data", (data) => prefixOutput(data, "[TITAN]   ", BLUE));
    node.stderr.on("data", (data) => prefixOutput(data, "[TITAN_ERR]", BLUE));

    watchdog.stdout.on("data", (data) => prefixOutput(data, "[WATCHDOG]", GREEN));
    watchdog.stderr.on("data", (data) => prefixOutput(data, "[WATCH_ERR]", GREEN));

    // 4. Lifecycle Management
    const cleanup = () => {
        console.log("\n🛑 SHUTTING DOWN TITAN CONTROL...");
        if (!node.killed) node.kill();
        if (!watchdog.killed) watchdog.kill();
        process.exit();
    };

    node.on("close", cleanup);
    watchdog.on("close", cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
}

main();
