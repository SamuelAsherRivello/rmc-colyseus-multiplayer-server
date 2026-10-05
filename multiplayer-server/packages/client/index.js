import { Client } from "@colyseus/sdk";

const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Generate an editable four-character suggestion. The server remains authoritative. */
export function suggestRoomCode() {
  const bytes = new Uint8Array(4);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map(value => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length]).join("");
}

export function readRoomCode(search = globalThis.location?.search ?? "") {
  const value = new URLSearchParams(search).get("room");
  return value?.trim().toUpperCase() ?? "";
}

export function buildRoomLink(code, url = globalThis.location?.href) {
  if (!url) throw new Error("A page URL is required to build a room link");
  const link = new URL(url);
  link.searchParams.set("room", String(code).trim().toUpperCase());
  return link.toString();
}

/** Shared anonymous session lifecycle. Each successful join creates a fresh identity. */
export class MultiplayerClient {
  constructor(endpoint, game = "multiplayer-draw", options = {}) {
    this.endpoint = endpoint.replace(/\/$/, "");
    this.game = game;
    this.options = { ...options };
    const linkedCode = readRoomCode();
    if (linkedCode && !options.code && options.create !== true) this.options = { ...this.options, code: linkedCode, create: false };
    this.listeners = new Set();
    this.state = { status: "idle", players: [], strokes: new Map(), gameState: null, chats: [], capacity: 12, sessionId: null, seat: null, hostId: null, transfer: null, lastAction: null, error: "" };
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
    if (old) { old.reconnection.enabled = false; void old.leave(); }
    this.state = { ...this.state, status: "connecting", sessionId: null, players: [], strokes: new Map(), gameState: null, chats: [], hostId: null, transfer: null, lastAction: null, error: "" };
    this.emit("status");
    let room;
    try {
      const response = await fetch(this.endpoint + "/api/join/" + encodeURIComponent(this.game), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(this.options), signal: AbortSignal.timeout(15000) });
      const payload = await response.json();
      const reservation = payload.reservation || payload;
      if (!response.ok) {
        const error = new Error(reservation.error || "Server unavailable");
        error.codeInUse = reservation.errorCode === "code_in_use";
        error.full = response.status === 409 && !error.codeInUse;
        error.expired = response.status === 404 || response.status === 400;
        throw error;
      }
      if (payload.code) {
        this.options = { code: payload.code, ...(payload.token ? { reconnectToken: payload.token } : this.options.reconnectToken ? { reconnectToken: this.options.reconnectToken } : {}) };
        this.state.code = payload.code;
        if (payload.token) this.state.reconnectToken = payload.token;
      }
      room = await new Client(this.endpoint).consumeSeatReservation(reservation);
      const recoversSeat = this.game === 'bomberman' || this.game === 'ring-rivals';
      room.reconnection.enabled = recoversSeat;
      if (recoversSeat) {
        room.reconnection.maxRetries = 18; room.reconnection.minDelay = 200; room.reconnection.maxDelay = 1000; room.reconnection.minUptime = 0;
        // The SDK can already have a retry timer queued when a consumer leaves.
        // Guard the public reconnect entry point against a stale lifecycle.
        const reconnect = room.connection.reconnect.bind(room.connection);
        room.connection.reconnect = options => {
          if (!this.stopped && generation === this.generation && room.reconnection.enabled) reconnect(options);
        };
        room.onDrop(() => { this.state.status = 'reconnecting'; this.state.error = 'Connection interrupted. Recovering your seat…'; this.emit('status'); });
        room.onReconnect(() => { this.state.status = 'connected'; this.state.error = ''; room.send('snapshot'); this.emit('status'); });
      }
      if (this.stopped || generation !== this.generation) { await room.leave(); return; }
      this.room = room;
      this.state.sessionId = room.sessionId;
      this.state.roomId = room.roomId;
      room.onMessage("identity", data => { this.state.seat = data?.seat ?? null; this.emit("identity"); });
      room.onMessage("snapshot", data => {
        this.state.players = data.players;
        this.state.strokes = new Map((data.strokes || []).map(s => [s.id, s]));
        this.state.capacity = data.capacity; this.state.gameState = data.gameState ?? null;
        this.state.chats = data.chats || [];
        this.state.hostId = data.hostId ?? data.gameState?.hostId ?? null;
        this.state.transfer = data.gameState?.transfer ?? null;
        this.state.capacity = data.capacity;
        this.state.status = "connected";
        this.state.error = "";
        this.retryDelay = 1000;
        this.emit("snapshot");
      });
      room.onMessage("gameState", data => { this.state.gameState = data; if (data?.hostId !== undefined) { this.state.hostId = data.hostId; this.state.transfer = data.transfer ?? null; } this.emit("gameState"); });
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
      room.onMessage("habitatAction", data => { this.state.lastAction = data; this.emit("habitatAction"); });
      room.onMessage("hostTransfer", data => { this.state.hostId = data?.hostId ?? null; this.state.transfer = data?.transfer ?? null; this.emit("hostTransfer"); });
      room.onError((_code, message) => { this.state.error = message || "Connection error"; this.emit("error"); });
      room.onLeave(() => {
        if (generation !== this.generation || this.stopped) return;
        this.room = undefined;
        this.schedule("Connection lost. Rejoining as a new player…");
      });
      room.send("snapshot");
      const heartbeat = this.game === "just-like-rabbits" ? setInterval(() => room.send("heartbeat"), 5000) : null;
      const snapshotDeadline = setTimeout(() => {
        if (generation === this.generation && this.state.status !== "connected" && !this.stopped) {
          void room.leave();
          this.schedule("Connection stalled. Retrying…");
        }
      }, 10000);
      room.onMessage("snapshot", () => clearTimeout(snapshotDeadline));
      room.onLeave(() => { clearTimeout(snapshotDeadline); if (heartbeat) clearInterval(heartbeat); });
    } catch (error) {
      if (room) { room.reconnection.enabled = false; void room.leave(); }
      if (generation !== this.generation || this.stopped) return;
      if (error.expired || error.codeInUse) { this.state.status = "error"; this.state.error = error.message; this.emit("status"); } else if (error.full) {
        this.state.status = "full";
        this.state.error = "This room is full. Try again when someone leaves.";
        this.emit("status");
      } else this.schedule("Cannot connect. Retrying…");
    }
  }
  schedule(message) {
    if (this.stopped) return;
    this.state = { ...this.state, status: "reconnecting", sessionId: null, players: [], strokes: new Map(), gameState: null, chats: [], hostId: null, transfer: null, lastAction: null, error: message };
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
    if (room) { room.reconnection.enabled = false; void room.leave(); }
    this.state = { ...this.state, status: "offline", sessionId: null, players: [], strokes: new Map(), gameState: null, chats: [], hostId: null, transfer: null, lastAction: null, roomId: null };
    this.emit("status");
  }
}


