export function registerHandlers(wss, sessionManager) {
  wss.on("connection", (ws) => {
    let currentSession = null;

    ws.on("message", (msg) => {
      const data = JSON.parse(msg);

      switch (data.type) {
        case "create-session":
          currentSession = handleCreateSession(ws, sessionManager);
          break;
        case "join-session":
          currentSession = handleJoinSession(ws, data, sessionManager);
          break;
        case "add-team":
          handleAddTeam(currentSession, data);
          break;
        case "update-score":
          handleUpdateTeamScore(currentSession, data);
          break;
      }
    });

    ws.on("close", () => {
      if (currentSession) {
        currentSession.clients.delete(ws);
        if (currentSession.clients.size === 0) {
          sessionManager.deleteSession(currentSession.id);
        }
      }
    });
  });
}

function broadcast(session, message) {
  const data = JSON.stringify(message);
  for (const client of session.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function handleCreateSession(ws, sessionManager) {
  const session = sessionManager.createSession();
  session.clients.add(ws);

  ws.send(JSON.stringify({
    type: "session-created",
    sessionId: session.id,
    joinCode: session.joinCode,
    teams: session.teams,
  }))

  return session;
}

function handleJoinSession(ws, sessionManager, data) {
  const session = sessionManager.getSessionByJoinCode(data.joinCode)

  if (!session) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Invalid join code.",
    }));
    return null;
  }

  session.clients.add(ws);

  ws.send(JSON.stringify({
    type: "session-joined",
    sessionId: session.id,
    teams: session.teams,
  }))

  return session;
}

function handleAddTeam(session, data) {
  if (!session) return;
  session.addTeam(data.teamName);
  broadcast(session, { type: "sync", teams: session.teams });
}


function handleUpdateTeamScore(session, data) {
  if (!session) return;
  session.updateScore(data.teamName, data.delta);
  broadcast(session, { type: "sync", teams: session.teams });
}

