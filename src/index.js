const socket = new WebSocket("ws://localhost:8080");

let sessionId = null;
let joinCode = null;
let teams = [];

const landingUI = document.createElement("div");
landingUI.innerHTML = `
  <button id="create-btn">Create Session</button>

  <h3>Join Session</h3>
  <input id="join-input" placeholder="ABCDE" maxlength="5">
  <button id="join-btn">Join</button>
`;

const sessionUI = document.createElement("div");
sessionUI.style.display = "none";
sessionUI.innerHTML = `
  <h2 id="session-title"></h2>
  <h3 id="code-display"></h3>

  <form id="team-form">
    <input id="team-input" placeholder="Team name">
    <button>Add Team</button>
  </form>

  <div id="team-list"></div>
`;

document.body.append(landingUI, sessionUI);

function showSessionUI() {
  landingUI.style.display = "none";
  sessionUI.style.display = "block";
}

function renderTeams() {
  const list = document.querySelector("#team-list");
  list.innerHTML = "";

  for (const team of teams) {
    const teamDiv = document.createElement("div");
    teamDiv.innerHTML = `
      <strong>${team.name}</strong>: ${team.score}
      <button data-delta="1">+</button>
      <button data-delta="-1">−</button>
    `;
    teamDiv.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        socket.send(JSON.stringify({
          type: "update-score",
          teamName: team.name,
          delta: parseInt(btn.dataset.delta, 10),
        }));
      };
    });

    list.appendChild(teamDiv);
  }
}

socket.addEventListener("open", () => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");

  if (code) {
    socket.send(JSON.stringify({ type: "join-session", joinCode: code }));
    joinCode = code;
  }
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "session-created") {
    joinCode = data.joinCode;
    sessionId = data.sessionId;
    teams = data.teams;

    history.replaceState({}, "", `?code=${joinCode}`);

    showSessionUI();
    document.querySelector("#code-display").textContent = `Join Code: ${joinCode}`;
    renderTeams();
  }

  if (data.type === "session-joined") {
    sessionId = data.sessionId;
    teams = data.teams;

    showSessionUI();
    document.querySelector("#code-display").textContent = `Join Code: ${joinCode}`;
    renderTeams();
  }

  if (data.type === "sync") {
    teams = data.teams;
    renderTeams();
  }

  if (data.type === "error") {
    history.replaceState({}, "", "/");
    alert(data.message);
  }
})

document.querySelector("#create-btn").onclick = () => {
  socket.send(JSON.stringify({ type: "create-session" }));
};

document.querySelector("#join-btn").onclick = () => {
  const code = document.querySelector("#join-input").value.trim().toUpperCase();
  if (code) {
    joinCode = code;
    socket.send(JSON.stringify({ type: "join-session", joinCode: code }));
  }
};

document.querySelector("#team-form").onsubmit = (e) => {
  e.preventDefault();
  const input = document.querySelector("#team-input");
  const name = input.value.trim();
  if (name) {
    socket.send(JSON.stringify({ type: "add-team", teamName: name }));
    input.value = "";
  }
}
