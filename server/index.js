// server.js
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

const wss = new WebSocketServer({ port: 8080 });
const sessions = new Map(); // sessionId -> { teams: [...], clients: Set<ws> }

function createSession() {
  const id = randomUUID();
  sessions.set(id, { teams: [], clients: new Set() });
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
      if (session) {
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

