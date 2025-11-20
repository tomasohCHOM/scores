import { WebSocketServer } from "ws";
import { SessionManager } from "./session.js";
import { registerHandlers } from "./ws.js";

function main() {
  const port = 8080;
  const wss = new WebSocketServer({ port });
  const sessionManager = new SessionManager();

  registerHandlers(wss, sessionManager);

  console.log(`[SERVER] Websocket server started on port ${port}`);
}

main();

