import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client Connected");
  ws.send("Hello from the server");
  ws.on("message", (message) => {
    console.log("Received this message:", message.toString());
    // Echo the message back to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    })
  })

  ws.on("close", () => {
    console.log("Connection Terminated")
  })
});
