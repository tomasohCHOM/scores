const socket = new WebSocket("ws://localhost:8080");

let sessionId = null;
let joinCode = null;
let teams = [];

const app = document.getElementById("app");

const landingUI = document.createElement("div");
landingUI.className = "landing-container";
landingUI.innerHTML = `
  <input id="join-input" placeholder="Session Code" maxlength="5">
  <div class="landing-btns">
    <button id="join-btn">Join</button>
    <button id="create-btn">Create Session</button>
  </div>
`;

const sessionUI = document.createElement("div");
sessionUI.style.display = "none";
sessionUI.className = "landing-container";
sessionUI.innerHTML = `
  <h2 id="code-display"></h2>
  <form id="team-form">
    <input id="team-input" placeholder="Team name">
    <button>Add Team</button>
  </form>
  <div id="team-list"></div>
`;

app.append(landingUI, sessionUI);

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
      <button class="score-btn" data-delta="1">+</button>
      <button class="score-btn" data-delta="-1">−</button>
      <button id="remove-btn">Remove Team</button>
    `;

    teamDiv.querySelectorAll(".score-btn").forEach((btn) => {
      btn.onclick = () => {
        socket.send(
          JSON.stringify({
            type: "update-score",
            teamName: team.name,
            delta: parseInt(btn.dataset.delta, 10),
          })
        );
      };
    });

    teamDiv.querySelector("#remove-btn").onclick = () => {
      socket.send(
        JSON.stringify({
          type: "delete-team",
          teamName: team.name,
        })
      );
    };

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
    document.querySelector("#code-display").textContent =
      `Join Code: ${joinCode}`;
    renderTeams();
  }

  if (data.type === "session-joined") {
    sessionId = data.sessionId;
    teams = data.teams;

    showSessionUI();
    document.querySelector("#code-display").textContent =
      `Join Code: ${joinCode}`;
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
});

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
};
