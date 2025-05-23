import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
let counter = 0;

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.send(JSON.stringify({ type: "init", counter }));

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "increment") {
      counter++;
    } else if (data.type === "decrement") {
      counter--;
    }

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "update", counter }));
      }
    })
  })

  ws.on("close", () => {
    console.log("Client disconnected");
  })
});
