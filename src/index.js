const socket = new WebSocket("ws://localhost:8080");

let sessionId = null;
let teams = [];

const ui = {
  sessionDisplay: document.createElement("h2"),
  form: document.createElement("form"),
  input: document.createElement("input"),
  teamList: document.createElement("div"),
};

ui.input.placeholder = "Team name";
ui.form.appendChild(ui.input);

document.body.append(ui.sessionDisplay, ui.form, ui.teamList);

ui.form.onsubmit = (e) => {
  e.preventDefault();
  const name = ui.input.value.trim();
  if (name) {
    socket.send(JSON.stringify({ type: "add-team", teamName: name }));
    ui.input.value = "";
  }
};

function renderTeams() {
  ui.teamList.innerHTML = "";
  for (const team of teams) {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${team.name}</strong>: ${team.score}
      <button data-delta="1">+</button>
      <button data-delta="-1">−</button>
    `;

    div.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        const delta = parseInt(btn.dataset.delta, 10);
        socket.send(JSON.stringify({ type: "update-score", teamName: team.name, delta }));
      };
    });

    ui.teamList.appendChild(div);
  }
}

socket.addEventListener("open", () => {
  const urlParams = new URLSearchParams(location.search);
  const joinId = urlParams.get("session");

  if (joinId) {
    socket.send(JSON.stringify({ type: "join-session", sessionId: joinId }));
  } else {
    socket.send(JSON.stringify({ type: "create-session" }));
  }
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "session-created" || data.type === "session-joined") {
    sessionId = data.sessionId;
    teams = data.teams;
    ui.sessionDisplay.textContent = `Session ID: ${sessionId}`;
    renderTeams();
  }

  if (data.type === "sync") {
    teams = data.teams;
    renderTeams();
  }

  if (data.type === "error") {
    alert(data.message);
  }
});

