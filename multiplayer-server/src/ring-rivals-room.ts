import { Room, type Client } from '@colyseus/core';
// @ts-expect-error The simulation is deliberately browser-safe plain JavaScript.
import { RingRivalsSimulation } from './ring-rivals-simulation.js';

export class RingRivalsRoom extends Room {
  maxClients = 2;
  simulation = new RingRivalsSimulation();
  seats = new Map<string, number>();
  limits = new Map<string, { time: number; count: number }>();

  onCreate(options: { code: string }) {
    this.setMetadata({ code: options.code });
    this.onMessage('input', (client, data) => {
      if (this.accept(client)) this.simulation.input(this.seats.get(client.sessionId), data);
    });
    this.onMessage('select', (client, data) => {
      if (this.accept(client)) this.simulation.select(this.seats.get(client.sessionId), data?.boxer);
      this.broadcastState();
    });
    this.onMessage('ready', client => {
      if (this.accept(client)) this.simulation.ready(this.seats.get(client.sessionId));
      this.broadcastState();
    });
    this.onMessage('rematch', client => {
      if (this.accept(client)) this.simulation.rematch(this.seats.get(client.sessionId));
      this.broadcastState();
    });
    this.onMessage('snapshot', client => {
      if (this.accept(client)) this.sendSnapshot(client);
    });
    this.setSimulationInterval(() => {
      this.simulation.step(1 / 30);
    }, 1000 / 30);
    this.clock.setInterval(() => this.broadcastState(), 50);
  }

  accept(client: Client) {
    const now = Date.now();
    let limit = this.limits.get(client.sessionId);
    if (!limit || now - limit.time >= 1000) {
      limit = { time: now, count: 0 };
      this.limits.set(client.sessionId, limit);
    }
    return ++limit.count <= 60;
  }

  players() {
    return [...this.seats].map(([id, seat]) => ({ id, number: seat + 1, name: `Player ${seat + 1}`, seat }));
  }

  sendSnapshot(client: Client) {
    client.send('snapshot', { players: this.players(), capacity: 2, code: this.metadata?.code, gameState: this.simulation.snapshot() });
  }

  broadcastState() {
    this.broadcast('gameState', this.simulation.snapshot());
    this.broadcast('presence', { players: this.players(), capacity: 2, code: this.metadata?.code });
  }

  onJoin(client: Client) {
    const occupied = new Set(this.seats.values());
    const seat = occupied.has(0) ? 1 : 0;
    this.seats.set(client.sessionId, seat);
    this.simulation.join(seat);
    this.broadcastState();
    this.sendSnapshot(client);
  }

  async onDrop(client: Client) {
    const seat = this.seats.get(client.sessionId);
    if (seat === undefined) return;
    this.simulation.connected(seat, false);
    this.broadcastState();
    try {
      await this.allowReconnection(client, 15);
    } catch {
      this.simulation.forfeit(seat);
      this.broadcastState();
    }
  }

  onReconnect(client: Client) {
    const seat = this.seats.get(client.sessionId);
    if (seat !== undefined) this.simulation.connected(seat, true);
    this.sendSnapshot(client);
    this.broadcastState();
  }

  onLeave(client: Client) {
    const seat = this.seats.get(client.sessionId);
    if (seat !== undefined) this.simulation.leave(seat);
    this.seats.delete(client.sessionId);
    this.limits.delete(client.sessionId);
    this.broadcast('departed', client.sessionId);
    this.broadcastState();
  }
}
