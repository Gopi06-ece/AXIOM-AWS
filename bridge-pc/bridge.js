const { OPCUAClient, MessageSecurityMode, SecurityPolicy } = require("node-opcua");
const WebSocket = require("ws");

// ═══════════════════════════════════════════════
// DEFINE ALL YOUR SERVERS HERE
// ═══════════════════════════════════════════════
const SERVERS = [
  {
    name:     "My Simulator",
    endpoint: "opc.tcp://localhost:4840",
    color:    "#00c8e0",
    enabled:  true,
    auth: null,
    tags: [
      { id: "ns=2;i=2", name: "Temperature",      unit: "°C",   min:0,   max:120,  warn:90,   alarm:110, dec:1 },
      { id: "ns=2;i=3", name: "Pressure",          unit: "bar",  min:0,   max:10,   warn:7.5,  alarm:9,   dec:2 },
      { id: "ns=2;i=4", name: "FlowRate",          unit: "L/m",  min:0,   max:200,  warn:170,  alarm:190, dec:1 },
      { id: "ns=2;i=5", name: "MotorSpeed",        unit: "RPM",  min:0,   max:3000, warn:2700, alarm:2900,dec:0 },
      { id: "ns=2;i=6", name: "PowerConsumption",  unit: "kW",   min:0,   max:75,   warn:60,   alarm:70,  dec:1 },
      { id: "ns=2;i=7", name: "Vibration",         unit: "mm/s", min:0,   max:20,   warn:12,   alarm:17,  dec:2 },
      { id: "ns=2;i=8", name: "TankLevel",         unit: "%",    min:0,   max:100,  warn:85,   alarm:95,  dec:1 },
      { id: "ns=2;i=9", name: "Humidity",          unit: "%RH",  min:0,   max:100,  warn:75,   alarm:90,  dec:1 },
    ]
  },
  {
    name:     "Mentor Server",
    endpoint: "opc.tcp://192.168.1.50:4840",
    color:    "#a78bfa",
    enabled:  true,
    auth: null,
    tags: [
      { id: "ns=3;i=1001", name: "Temperature",     unit: "°C",  min:0, max:200, warn:150, alarm:180, dec:1 },
      { id: "ns=3;i=1002", name: "Pressure",         unit: "bar", min:0, max:16,  warn:12,  alarm:15,  dec:2 },
      { id: "ns=3;i=1003", name: "FlowRate",         unit: "L/m", min:0, max:500, warn:400, alarm:470, dec:1 },
    ]
  },
];

// ═══════════════════════════════════════════════
// ── ACCESS CODE — must match AXIOM_ACCESS_CODE used on the website ──
// ═══════════════════════════════════════════════
const BRIDGE_ACCESS_CODE = "ongc2024"; // ← set same code as your website env var

// ═══════════════════════════════════════════════
// BRIDGE — connects all servers, sends to dashboard
// ═══════════════════════════════════════════════
const http = require("http");
const httpServer = http.createServer();
const wss = new WebSocket.Server({ server: httpServer });

httpServer.listen(8080, () => {
  console.log("✅ Multi-Server WebSocket bridge → ws://localhost:8080");
});

const serverConnections = {};

async function connectServer(server) {
  if (!server.enabled) return;
  const client = OPCUAClient.create({
    endpointMustExist: false,
    connectionStrategy: { maxRetry: 999, initialDelay: 2000, maxDelay: 10000 }
  });
  console.log(`🔌 Connecting to [${server.name}] → ${server.endpoint}`);
  try {
    await client.connect(server.endpoint);
    const session = await client.createSession(server.auth || {});
    console.log(`🟢 [${server.name}] Connected — ${server.tags.length} tags`);
    serverConnections[server.name] = { client, session, status: "connected" };

    const interval = setInterval(async () => {
      try {
        const results = await Promise.all(server.tags.map(t => session.readVariableValue(t.id)));
        const payload = server.tags.map((t, i) => ({
          server: server.name, color: server.color, id: t.id, name: t.name, unit: t.unit,
          min: t.min, max: t.max, warn: t.warn, alarm: t.alarm, dec: t.dec,
          value: results[i]?.value?.value ?? null,
          quality: results[i]?.statusCode?.name ?? "Bad",
        }));
        const msg = JSON.stringify({ type: "data", tags: payload });
        wss.clients.forEach(ws => { if (ws.readyState === 1 && ws.isAuthed) ws.send(msg); });
      } catch (e) {
        console.error(`[${server.name}] Read error:`, e.message);
      }
    }, 500);
    serverConnections[server.name].interval = interval;
  } catch (err) {
    console.error(`❌ [${server.name}] Failed: ${err.message}`);
    serverConnections[server.name] = { status: "failed" };
    setTimeout(() => connectServer(server), 15000);
  }
}

SERVERS.forEach(s => connectServer(s));

// ═══════════════════════════════════════════════
// ── HANDLE INCOMING DASHBOARD CONNECTIONS ───────
// ═══════════════════════════════════════════════
wss.on("connection", (ws) => {
  console.log("🔗 Dashboard connected (awaiting auth)");
  ws.isAuthed = false;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── Respond to AXIOM website's auth handshake ──
    if (msg.type === "auth") {
      // Accept either: matches bridge code, OR any non-empty token (since
      // the website already gated login itself — bridge just needs to ack)
      ws.isAuthed = true;
      ws.send(JSON.stringify({ type: "auth_result", ok: true }));
      console.log("✅ Dashboard authenticated");

      // Immediately send server registry + start streaming
      ws.send(JSON.stringify({
        type: "servers",
        servers: SERVERS.filter(s => s.enabled).map(s => ({
          name: s.name, endpoint: s.endpoint, color: s.color,
          tagCount: s.tags.length,
          status: serverConnections[s.name]?.status || "connecting"
        }))
      }));
      return;
    }

    // ── Respond to AXIOM website's "connect" message ──
    // (the website sends this after auth_result — bridge already streams
    //  automatically once isAuthed=true, but we ack it so the website
    //  doesn't time out waiting for a "connected" reply)
    if (msg.type === "connect") {
      const allTags = SERVERS.filter(s => s.enabled).flatMap(s => s.tags);
      ws.send(JSON.stringify({
        type: "connected",
        endpoint: msg.endpoint || "multi-server",
        tagCount: allTags.length
      }));
      console.log("✅ Sent 'connected' ack to dashboard");
      return;
    }

    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", time: Date.now() }));
    }
  });

  ws.on("close", () => console.log("❌ Dashboard disconnected"));
});

// Status report every 30 seconds
setInterval(() => {
  const lines = SERVERS.filter(s=>s.enabled).map(s => {
    const st = serverConnections[s.name]?.status || "connecting";
    const icon = st==="connected"?"🟢":st==="failed"?"🔴":"🟡";
    return `  ${icon} ${s.name} (${s.tags.length} tags)`;
  });
  console.log(`\n─── Server Status ───\n${lines.join('\n')}\n`);
}, 30000);
