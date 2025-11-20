import { randomUUID } from "crypto";

export class Session {
  constructor(id, joinCode) {
    this.id = id;
    this.joinCode = joinCode;
    this.teams = [];
    this.clients = new Set();
  }

  addTeam(name) {
    this.teams.push({ name, score: 0 });
  }

  updateScore(teamName, delta) {
    const team = this.teams.find((t) => t.name === teamName);
    if (team) {
      team.score += delta;
    }
  }
}

export class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> Session
    this.sessionsByCode = new Map(); // joinCode -> Session
    this.joinCodes = new Set();
    this.codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  generateJoinCode() {
    let joinCode;
    do {
      joinCode = "";
      for (let i = 0; i < 5; i++) {
        joinCode += this.codeChars[Math.floor(Math.random() * this.codeChars.length)];
      }
    } while (this.joinCodes.has(joinCode))

    this.joinCodes.add(joinCode);
    return joinCode;
  }

  createSession() {
    const id = randomUUID();
    const joinCode = this.generateJoinCode();
    const session = new Session(id, joinCode);
    this.sessions.set(id, session);
    this.sessionsByCode.set(joinCode, session);

    return session;
  }

  getSessionByJoinCode(joinCode) {
    this.sessionsByCode.get(joinCode) || null;
  }

  deleteSession(id) {
    const session = this.sessions.get(id);
    if (!session) return;

    this.joinCodes.delete(session.joinCode);
    this.sessionsByCode.delete(session.joinCode);
    this.sessions.delete(id);
  }
}
