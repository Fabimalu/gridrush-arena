const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DURATIONS = new Set([60, 120, 300, 600]);
const SCENARIOS = new Set(["clean", "crown", "squeeze", "rush", "stairs", "vault"]);
const rooms = new Map();
const queues = new Map();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      writeCors(res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`GridRush Arena running at http://localhost:${PORT}`);
});

setInterval(cleanupRooms, 10 * 60 * 1000).unref();

async function handleApi(req, res, url) {
  const segments = url.pathname.split("/").filter(Boolean);

  if (req.method === "POST" && url.pathname === "/api/rooms") {
    const body = await readJson(req);
    const room = createRoom(body);
    sendJson(res, 200, publicRoom(room));
    broadcast(room);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/matchmake") {
    const body = await readJson(req);
    const room = matchmake(body);
    sendJson(res, 200, publicRoom(room));
    broadcast(room);
    return;
  }

  if (segments[1] === "rooms" && segments[2]) {
    const code = segments[2].toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      sendJson(res, 404, { error: "Room not found" });
      return;
    }

    if (req.method === "GET" && segments.length === 3) {
      sendJson(res, 200, publicRoom(room));
      return;
    }

    if (req.method === "POST" && segments[3] === "join") {
      const body = await readJson(req);
      addPlayer(room, body);
      if (room.players.length >= 2) startRoom(room);
      sendJson(res, 200, publicRoom(room));
      broadcast(room);
      return;
    }

    if (req.method === "POST" && segments[3] === "state") {
      const body = await readJson(req);
      updatePlayerState(room, body);
      sendJson(res, 200, publicRoom(room));
      broadcast(room);
      return;
    }
  }

  if (req.method === "GET" && segments[1] === "events" && segments[2]) {
    const code = segments[2].toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      sendJson(res, 404, { error: "Room not found" });
      return;
    }
    attachEvents(req, res, room);
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
}

function createRoom(body) {
  const duration = normalizeDuration(body.duration);
  const scenario = normalizeScenario(body.scenario);
  const room = {
    code: makeCode(),
    duration,
    scenario,
    seed: crypto.randomInt(1, 2_000_000_000),
    status: "waiting",
    startedAt: null,
    matchmaking: false,
    createdAt: Date.now(),
    players: [],
    watchers: new Set(),
  };
  rooms.set(room.code, room);
  addPlayer(room, body);
  return room;
}

function matchmake(body) {
  const duration = normalizeDuration(body.duration);
  const scenario = normalizeScenario(body.scenario);
  const key = `${duration}:${scenario}`;
  const waitingCode = queues.get(key);
  const waiting = waitingCode ? rooms.get(waitingCode) : null;

  if (waiting && waiting.status === "waiting" && !waiting.players.some((player) => player.id === body.playerId)) {
    addPlayer(waiting, body);
    startRoom(waiting);
    queues.delete(key);
    return waiting;
  }

  const room = createRoom({ ...body, duration, scenario });
  room.matchmaking = true;
  queues.set(key, room.code);
  return room;
}

function addPlayer(room, body) {
  const id = String(body.playerId || crypto.randomUUID()).slice(0, 64);
  const existing = room.players.find((player) => player.id === id);
  if (existing) {
    existing.name = cleanName(body.name);
    existing.lastSeen = Date.now();
    return existing;
  }

  if (room.players.length >= 2) {
    const error = new Error("Room is full");
    error.statusCode = 409;
    throw error;
  }

  const player = {
    id,
    name: cleanName(body.name),
    score: 0,
    lines: 0,
    finished: false,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  };
  room.players.push(player);
  return player;
}

function startRoom(room) {
  if (room.status === "active") return;
  room.status = "active";
  room.startedAt = Date.now() + 2500;
}

function updatePlayerState(room, body) {
  const player = room.players.find((item) => item.id === body.playerId);
  if (!player) return;
  player.score = clampNumber(body.score, 0, 9999999);
  player.lines = clampNumber(body.lines, 0, 9999);
  player.finished = Boolean(body.finished);
  player.lastSeen = Date.now();
}

function attachEvents(req, res, room) {
  writeCors(res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(`data: ${JSON.stringify({ room: publicRoom(room) })}\n\n`);
  room.watchers.add(res);

  req.on("close", () => {
    room.watchers.delete(res);
  });
}

function broadcast(room) {
  if (!room.watchers.size) return;
  const payload = `data: ${JSON.stringify({ room: publicRoom(room) })}\n\n`;
  for (const watcher of room.watchers) {
    watcher.write(payload);
  }
}

function publicRoom(room) {
  return {
    code: room.code,
    duration: room.duration,
    scenario: room.scenario,
    seed: room.seed,
    status: room.status,
    startedAt: room.startedAt,
    matchmaking: room.matchmaking,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      lines: player.lines,
      finished: player.finished,
      lastSeen: player.lastSeen,
    })),
  };
}

function serveStatic(req, res, url) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const cleanPath = path.normalize(pathname).replace(/^([/\\]*\.\.[/\\])+/, "");
  const fullPath = path.join(ROOT, cleanPath);

  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mimeType(fullPath),
      "Cache-Control": fullPath.endsWith("index.html") ? "no-cache" : "public, max-age=3600",
    });
    res.end(data);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, payload) {
  writeCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function writeCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeDuration(value) {
  const duration = Number(value);
  return DURATIONS.has(duration) ? duration : 60;
}

function normalizeScenario(value) {
  return SCENARIOS.has(value) ? value : "clean";
}

function cleanName(value) {
  return String(value || "Giocatore").trim().slice(0, 18) || "Giocatore";
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 6; i += 1) {
      code += chars[crypto.randomInt(chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
  }[ext] || "application/octet-stream";
}

function cleanupRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const stale = now - room.createdAt > 6 * 60 * 60 * 1000;
    const empty = room.players.every((player) => now - player.lastSeen > 30 * 60 * 1000);
    if (stale || empty) {
      rooms.delete(code);
      room.watchers.forEach((watcher) => watcher.end());
    }
  }
}
