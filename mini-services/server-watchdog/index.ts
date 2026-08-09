import { serve } from "bun";

const MAIN_SERVER_PORT = 3000;
const WATCHDOG_PORT = 3099;
let mainServerProcess: Bun.Process | null = null;
let restartCount = 0;

function startMainServer() {
  console.log(`[Watchdog] Starting Next.js server (restart #${++restartCount})...`);
  
  if (mainServerProcess) {
    try { mainServerProcess.kill(); } catch {}
  }
  
  mainServerProcess = Bun.spawn(["bun", "run", "dev"], {
    cwd: "/home/z/my-project",
    stdout: "inherit",
    stderr: "inherit",
  });
  
  mainServerProcess.exited.then((code) => {
    console.log(`[Watchdog] Main server exited with code ${code}. Restarting in 3s...`);
    setTimeout(startMainServer, 3000);
  });
}

// Health check endpoint
serve({
  port: WATCHDOG_PORT,
  fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        mainServerPort: MAIN_SERVER_PORT,
        restartCount,
        mainServerAlive: mainServerProcess !== null && !mainServerProcess.killed,
        uptime: process.uptime(),
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    if (url.pathname === "/restart") {
      startMainServer();
      return new Response(JSON.stringify({ status: "restarting" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response("PakVisa Watchdog");
  },
});

console.log(`[Watchdog] Running on port ${WATCHDOG_PORT}`);
startMainServer();
