const socket = new WebSocket("ws://localhost:8080");

let counter = 0;

const counterDisplay = document.createElement("h1");
counterDisplay.textContent = `Counter: ${counter}`;

const incrementBtn = document.createElement("button");
incrementBtn.textContent = "+";
incrementBtn.onclick = () => socket.send(JSON.stringify({ type: "increment" }));

const decrementBtn = document.createElement("button");
decrementBtn.textContent = "−";
decrementBtn.onclick = () => socket.send(JSON.stringify({ type: "decrement" }));

document.body.append(counterDisplay, incrementBtn, decrementBtn);

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "init" || data.type === "update") {
    counter = data.counter;
    counterDisplay.textContent = `Counter: ${counter}`;
  }
});
