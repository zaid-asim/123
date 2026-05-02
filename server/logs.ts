// server/logs.ts
let logs: { timestamp: string; source: string; message: string }[] = [];
const MAX_LOGS = 500;
export function addLog(message: string, source = "express") {
  const timestamp = new Date().toISOString();
  logs.push({ timestamp, source, message });
  if (logs.length > MAX_LOGS) logs.shift();
  // also output to console (existing behavior)
  console.log(`${new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })} [${source}] ${message}`);
}
export function getLogs() {
  return logs.slice().reverse(); // most recent first
}
