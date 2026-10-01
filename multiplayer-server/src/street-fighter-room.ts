import { randomUUID } from "node:crypto";
import { Room, type Client } from "@colyseus/core";
// The same browser-safe deterministic rules are exported by the shared client package.
// @ts-expect-error The package's simulation module is plain JavaScript.
import { StreetFighterSimulation } from "../packages/client/street-fighter-simulation.js";

export class StreetFighterRoom extends Room {
  maxClients = 2;
  autoDispose = false;
  simulation = new StreetFighterSimulation();
  limits = new Map<string, { time: number; count: number }>();

  onCreate(options: { code: string }) {
    this.setMetadata({ code: options.code });
    this.onMessage("snapshot", (client) => { if (this.accept(client)) client.send("snapshot", { players: this.players(), capacity: 2, gameState: this.simulation.snapshot() }); });
    this.onMessage("select", (client, data) => { if (this.accept(client)) this.simulation.select(client.sessionId, data?.fighter); });
    this.onMessage("ready", (client, data) => { if (this.accept(client)) this.simulation.ready(client.sessionId, data?.ready); });
    this.onMessage("input", (client, data) => { if (this.accept(client)) this.simulation.input(client.sessionId, data); });
    this.onMessage("rematch", (client, data) => { if (this.accept(client)) this.simulation.ready(client.sessionId, data?.ready); });
    this.setSimulationInterval(() => this.simulation.step(1 / 60), 1000 / 60);
    this.clock.setInterval(() => this.broadcast("gameState", this.simulation.snapshot()), 50);
  }

  accept(client: Client) {
    const now = Date.now(); let limit = this.limits.get(client.sessionId);
    if (!limit || now - limit.time >= 1000) { limit = { time: now, count: 0 }; this.limits.set(client.sessionId, limit); }
    return ++limit.count <= 60;
  }

  players() { return this.simulation.seats.map((seat: { sessionId: string | null; number: number; fighter: string; connected: boolean }) => ({ id: seat.sessionId, number: seat.number, fighter: seat.fighter, connected: seat.connected })); }

  onJoin(client: Client, options: { reconnectToken?: string }) {
    const token = options?.reconnectToken;
    const seat = this.simulation.reconnect(client.sessionId, token) ?? this.simulation.add(client.sessionId, token);
    if (!seat) { client.send("notice", "Room is full or reconnect token expired"); void client.leave(4003); return; }
    client.send("identity", { seat: seat.number });
    this.broadcast("presence", { players: this.players(), capacity: 2, gameState: this.simulation.snapshot() });
  }

  onLeave(client: Client) {
    this.simulation.disconnect(client.sessionId); this.limits.delete(client.sessionId);
    this.broadcast("departed", client.sessionId);
    this.broadcast("presence", { players: this.players(), capacity: 2, gameState: this.simulation.snapshot() });
    this.clock.setTimeout(() => { if (this.clients.length === 0) void this.disconnect(); }, 16000);
  }
}
