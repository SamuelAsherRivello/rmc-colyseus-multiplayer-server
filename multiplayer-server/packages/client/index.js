import { Client } from "@colyseus/sdk";

/** Shared anonymous session lifecycle. Each successful join creates a fresh identity. */
export class MultiplayerClient {
  constructor(endpoint, game = "multiplayer-draw") {
    this.endpoint = endpoint.replace(/\/$/, "");
    this.game = game;
    this.listeners = new Set();
    this.state = { status: "idle", players: [], strokes: new Map(), gameState: null, chats: [], capacity: 12, sessionId: null, error: "" };
    this.stopped = true;
    this.generation = 0;
    this.retryDelay = 1000;
  }
  subscribe(listener) { this.listeners.add(listener); listener(this.state, "initial"); return () => this.listeners.delete(listener); }
  emit(event) { for (const listener of this.listeners) listener(this.state, event); }
  async connect() {
    this.stopped = false;
    const generation = ++this.generation;
    clearTimeout(this.timer);
    const old = this.room; this.room = undefined;
    if (old) void old.leave();
    this.state = { ...this.state, status: "connecting", sessionId: null, players: [], strokes: new Map(), gameState: null, chats: [], error: "" };
    this.emit("status");
    let room;
    try {
      const response = await fetch(this.endpoint + "/api/join/" + encodeURIComponent(this.game), { method: "POST", signal: AbortSignal.timeout(15000) });
      const reservation = await response.json();
      if (!response.ok) {
        const error = new Error(reservation.error || "Server unavailable");
        error.full = response.status === 409;
        throw error;
      }
      room = await new Client(this.endpoint).consumeSeatReservation(reservation);
      room.reconnection.enabled = false;
      if (this.stopped || generation !== this.generation) { await room.leave(); return; }
      this.room = room;
      this.state.sessionId = room.sessionId;
      this.state.roomId = room.roomId;
      room.onMessage("snapshot", data => {
        this.state.players = data.players;
        this.state.strokes = new Map((data.strokes || []).map(s => [s.id, s]));
        this.state.capacity = data.capacity; this.state.gameState = data.gameState ?? null;
        this.state.chats = data.chats || [];
        this.state.capacity = data.capacity;
        this.state.status = "connected";
        this.state.error = "";
        this.retryDelay = 1000;
        this.emit("snapshot");
      });
      room.onMessage("gameState", data => { this.state.gameState = data; this.emit("gameState"); });
      room.onMessage("presence", data => { Object.assign(this.state, data); this.emit("presence"); });
      room.onMessage("garden", data => { this.state.players = data.players; this.emit("garden"); });
      room.onMessage("chat", data => { this.state.chats = [...(this.state.chats || []), data].slice(-100); this.emit("chat"); });
      room.onMessage("cursor", data => {
        const player = this.state.players.find(p => p.id === data.id);
        if (player) player.cursor = data.cursor;
        this.emit("cursor");
      });
      room.onMessage("stroke", data => {
        let stroke = this.state.strokes.get(data.id);
        if (!stroke) { stroke = { id: data.id, owner: data.owner, points: [], complete: false }; this.state.strokes.set(data.id, stroke); }
        if (stroke.points.length === data.offset) stroke.points.push(...data.points);
        stroke.complete = data.complete;
        this.emit("stroke");
      });
      room.onMessage("erase", id => { this.state.strokes.delete(id); this.emit("erase"); });
      room.onMessage("departed", id => {
        for (const [key, stroke] of this.state.strokes) if (stroke.owner === id) this.state.strokes.delete(key);
        this.state.players = this.state.players.filter(p => p.id !== id);
        this.emit("departed");
      });
      room.onMessage("notice", text => { this.state.error = text; this.emit("notice"); });
      room.onError((_code, message) => { this.state.error = message || "Connection error"; this.emit("error"); });
      room.onLeave(() => {
        if (generation !== this.generation || this.stopped) return;
        this.room = undefined;
        this.schedule("Connection lost. Rejoining as a new player…");
      });
      room.send("snapshot");
      const snapshotDeadline = setTimeout(() => {
        if (generation === this.generation && this.state.status !== "connected" && !this.stopped) {
          void room.leave();
          this.schedule("Connection stalled. Retrying…");
        }
      }, 10000);
      room.onMessage("snapshot", () => clearTimeout(snapshotDeadline));
      room.onLeave(() => clearTimeout(snapshotDeadline));
    } catch (error) {
      if (room) void room.leave();
      if (generation !== this.generation || this.stopped) return;
      if (error.full) {
        this.state.status = "full";
        this.state.error = "This room is full. Try again when someone leaves.";
        this.emit("status");
      } else this.schedule("Cannot connect. Retrying…");
    }
  }
  schedule(message) {
    if (this.stopped) return;
    this.state = { ...this.state, status: "reconnecting", sessionId: null, players: [], strokes: new Map(), gameState: null, chats: [], error: message };
    this.emit("status");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.connect(), this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 15000);
  }
  send(type, message) { if (this.state.status === "connected") this.room?.send(type, message); }
  disconnect() {
    this.stopped = true; this.generation++;
    clearTimeout(this.timer);
    const room = this.room; this.room = undefined;
    if (room) void room.leave();
    this.state = { ...this.state, status: "offline", sessionId: null, players: [], strokes: new Map(), gameState: null, chats: [], roomId: null };
    this.emit("status");
  }
}
