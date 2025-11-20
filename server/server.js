import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

const port = 8080;
const wss = new WebSocketServer({ port });
// Maps sessionId -> { joinCode, teams: [...], clients: Set<ws> }
const sessions = new Map();
const joinCodes = new Set();

function createSession() {
  const id = randomUUID();
  // Make joinCode consisting of random characters frmo the set [A-Z, 0-9]
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let joinCode = "";
  do {
    joinCode = "";
    for (let i = 0; i < 5; ++i) {
      joinCode += chars[Math.floor(Math.random() * chars.length)]
    }
  } while (joinCodes.has(joinCode));

  joinCodes.add(joinCode)
  sessions.set(id, { joinCode, teams: [], clients: new Set() });
  return id;
}

function getSession(id) {
  return sessions.get(id);
}

function broadcast(session, message) {
  const data = JSON.stringify(message);
  for (const client of session.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function handleMessage(sessionId, data) {
  const session = getSession(sessionId);
  if (!session) return;

  switch (data.type) {
    case "add-team":
      session.teams.push({ name: data.name, score: 0 });
      break;
    case "update-score":
      const team = session.teams.find((t) => t.name === data.teamName);
      if (team) team.score += data.delta;
      break;
    default:
      return;
  }

  broadcast(session, { type: "sync", teams: session.teams });
}

wss.on("connection", (ws) => {
  let currentSessionId = null;

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "create-session") {
      const id = createSession();
      const session = getSession(id);
      session.clients.add(ws);
      currentSessionId = id;

      ws.send(JSON.stringify({ type: "session-created", sessionId: id, teams: session.teams }));
    }

    else if (data.type === "join-session") {
      const session = getSession(data.sessionId);
      if (session && session.joinCode === data.joinCode) {
        session.clients.add(ws);
        currentSessionId = data.sessionId;
        ws.send(JSON.stringify({ type: "session-joined", sessionId: data.sessionId, teams: session.teams }));
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Invalid session ID" }));
      }
    }
    else {
      handleMessage(currentSessionId, data);
    }
  });

  ws.on("close", () => {
    if (!currentSessionId) return;
    const session = getSession(currentSessionId);
    if (session) {
      session.clients.delete(ws);
      if (session.clients.size === 0) {
        sessions.delete(currentSessionId); // optional: cleanup
      }
    }
  });
});

function main() {
  const port = 8080;
  const wss = new WebSocketServer({ port });
  console.log(`[INFO] Websocket server started on port ${port}`);
}

main();

