import { createGame, stepGame } from '../packages/client/bomberman-rules.js';

export class BombermanSimulation {
  constructor(code = '') {
    this.code = code; this.players = new Map(); this.inputs = new Map(); this.received = new Map();
    this.phase = 'lobby'; this.clock = 0; this.round = 0; this.match = 0; this.until = 0;
    this.game = createGame([]); this.winner = null; this.matchWinner = null;
  }
  add(id) {
    const taken = new Set([...this.players.values()].map(p => p.number));
    const number = [0, 1, 2, 3].find(n => !taken.has(n));
    if (number === undefined) return false;
    this.players.set(id, { id, number, name: `Player ${number + 1}`, color: number, ready: false, connected: true, score: 0, ack: -1 });
    return true;
  }
  remove(id) {
    this.players.delete(id); this.inputs.delete(id); this.received.delete(id);
    const p = this.game.players.find(p => p.id === id); if (p) p.alive = false;
  }
  connected(id, value) {
    const p = this.players.get(id); if (p) { p.connected = value; p.ready = false; }
    this.inputs.delete(id);
  }
  ready(id) {
    const p = this.players.get(id);
    if (this.phase === 'lobby' && p?.connected) p.ready = !p.ready;
  }
  rematch(id) {
    const p = this.players.get(id);
    if (this.phase === 'matchResults' && p?.connected) p.ready = !p.ready;
  }
  color(id, color) {
    if (this.phase !== 'lobby' || !Number.isInteger(color) || color < 0 || color > 3) return;
    const p = this.players.get(id);
    if (p && ![...this.players.values()].some(q => q.id !== id && q.color === color)) p.color = color;
  }
  input(id, data) {
    const p = this.players.get(id);
    if (!p?.connected || this.phase !== 'playing' || !data || typeof data !== 'object') return false;
    if (!Number.isSafeInteger(data.seq) || data.seq < 0 || data.seq <= (this.received.get(id) ?? p.ack) ||
        !Number.isFinite(data.x) || Math.abs(data.x) > 1 || !Number.isFinite(data.y) || Math.abs(data.y) > 1 || typeof data.bomb !== 'boolean') return false;
    this.received.set(id, data.seq);
    const previous = this.inputs.get(id);
    this.inputs.set(id, { seq: data.seq, x: data.x, y: data.y, bomb: data.bomb || previous?.bomb || false, at: this.clock });
    return true;
  }
  startMatch() {
    this.match++; this.round = 0; this.matchWinner = null;
    this.inputs.clear(); this.received.clear();
    for (const p of this.players.values()) { p.score = 0; p.ack = -1; p.ready = false; }
    this.begin();
  }
  begin() {
    this.round++;
    const ordered = [...this.players.values()].filter(p => p.connected).sort((a, b) => a.number - b.number);
    this.game = createGame(ordered.map(p => p.id), this.match * 1000 + this.round);
    this.inputs.clear(); this.phase = 'countdown'; this.until = this.clock + 180; this.winner = null;
    for (const p of this.players.values()) p.ready = false;
  }
  lobby() {
    this.phase = 'lobby'; this.until = 0; this.inputs.clear();
    for (const p of this.players.values()) p.ready = false;
  }
  step() {
    this.clock++;
    const connected = [...this.players.values()].filter(p => p.connected);
    if (this.phase === 'lobby' || this.phase === 'matchResults') {
      if (this.phase === 'matchResults' && connected.length < 2) { this.lobby(); return; }
      if (connected.length >= 2 && connected.every(p => p.ready)) this.startMatch();
      return;
    }
    if (this.phase === 'countdown') {
      if (connected.length < 2) { this.lobby(); return; }
      if (this.clock >= this.until) { this.phase = 'playing'; this.until = this.clock + 7200; }
      return;
    }
    if (this.phase === 'results') {
      if (this.clock >= this.until) { if (connected.length >= 2) this.begin(); else this.lobby(); }
      return;
    }
    if (this.phase !== 'playing') return;
    const inputs = {};
    for (const [id, input] of this.inputs) {
      if (this.clock - input.at <= 18) {
        inputs[id] = { x: input.x, y: input.y, bomb: input.bomb };
        const p = this.players.get(id); if (p) p.ack = input.seq;
      }
      input.bomb = false;
    }
    stepGame(this.game, inputs);
    const survivors = this.game.players.filter(p => p.alive);
    if (survivors.length <= 1 || this.clock >= this.until) {
      this.winner = survivors.length === 1 ? survivors[0].id : null;
      const winner = this.players.get(this.winner);
      if (winner) winner.score++;
      this.matchWinner = winner?.score >= 3 ? winner.id : null;
      this.phase = this.matchWinner ? 'matchResults' : 'results';
      this.until = this.matchWinner ? 0 : this.clock + 180;
      for (const p of this.players.values()) p.ready = false;
      this.inputs.clear();
    }
  }
  snapshot() {
    // Do not expose hidden item locations or the full future wall schedule.
    const { hidden, waves, pendingPowerups, ...visible } = this.game;
    return { ...visible, code: this.code, phase: this.phase, match: this.match, round: this.round,
      serverTick: this.clock, remaining: Math.max(0, (this.until - this.clock) / 60),
      winner: this.winner, matchWinner: this.matchWinner, people: [...this.players.values()],
      players: this.game.players.map(p => ({ ...p, ...this.players.get(p.id) })) };
  }
}
