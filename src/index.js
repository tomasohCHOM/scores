const socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("open", () => {
  console.log("Connected to WebSocket backend");
  socket.send("Hello from the client");
});

socket.addEventListener("message", (event) => {
  console.log("Message from the server:", event.data);
})

