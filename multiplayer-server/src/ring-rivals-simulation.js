const ACTIONS = new Set([
  'jab-head', 'cross-head', 'jab-body', 'cross-body',
  'guard-high', 'guard-low', 'dodge-left', 'dodge-right', 'neutral',
]);
const ATTACKS = Object.freeze({
  'jab-head': { target: 'head', windup: 8, recovery: 18, damage: 8, cost: 8 },
  'cross-head': { target: 'head', windup: 13, recovery: 27, damage: 14, cost: 14 },
  'jab-body': { target: 'body', windup: 10, recovery: 21, damage: 10, cost: 10 },
  'cross-body': { target: 'body', windup: 15, recovery: 30, damage: 16, cost: 17 },
});
const ROUND_SECONDS = 60;
const MAX_HEALTH = 100;
const MAX_STAMINA = 100;

function makeFighter(seat) {
  return {
    seat,
    boxer: seat === 0 ? 'rook' : 'flash',
    ready: false,
    connected: true,
    health: MAX_HEALTH,
    stamina: MAX_STAMINA,
    action: 'idle',
    actionFrame: 0,
    sequence: -1,
    x: 0,
    hitFlash: 0,
  };
}

export class RingRivalsSimulation {
  constructor() {
    this.time = 0;
    this.tick = 0;
    this.phase = 'lobby';
    this.round = 1;
    this.roundSeconds = ROUND_SECONDS;
    this.rounds = [0, 0];
    this.winner = null;
    this.result = '';
    this.players = [null, null];
    this.countdown = 0;
  }

  join(seat) {
    if (seat !== 0 && seat !== 1) return false;
    if (this.players[seat]) return false;
    this.players[seat] = makeFighter(seat);
    return true;
  }

  select(seat, boxer) {
    const fighter = this.fighter(seat);
    if (!fighter || this.phase !== 'lobby' || fighter.ready || !['rook', 'flash'].includes(boxer)) return false;
    fighter.boxer = boxer;
    return true;
  }

  ready(seat) {
    const fighter = this.fighter(seat);
    if (!fighter || !fighter.connected || this.phase !== 'lobby') return false;
    fighter.ready = true;
    if (this.players.every(player => player?.ready && player.connected)) {
      this.phase = 'countdown';
      this.countdown = 3;
    }
    return true;
  }

  rematch(seat) {
    const fighter = this.fighter(seat);
    if (!fighter || this.phase !== 'matchover') return false;
    fighter.ready = true;
    if (this.players.every(player => player?.ready && player.connected)) this.resetMatch();
    return true;
  }

  input(seat, data) {
    const fighter = this.fighter(seat);
    if (!fighter || !fighter.connected || this.phase !== 'round' || !data || typeof data !== 'object') return false;
    if (!Number.isSafeInteger(data.sequence) || data.sequence <= fighter.sequence || !ACTIONS.has(data.action)) return false;
    fighter.sequence = data.sequence;
    if (data.action === 'neutral') {
      if (!fighter.action.startsWith('attack-') && !fighter.action.startsWith('hit-')) {
        fighter.action = 'idle'; fighter.actionFrame = 0; fighter.x = 0;
      }
      return true;
    }
    if (data.action === 'guard-high' || data.action === 'guard-low') {
      if (fighter.action.startsWith('attack-') || fighter.action.startsWith('hit-')) return false;
      fighter.action = data.action;
      fighter.actionFrame = 0;
      fighter.x = 0;
      return true;
    }
    if (data.action.startsWith('dodge-')) {
      if (fighter.action.startsWith('attack-') || fighter.action.startsWith('hit-') || fighter.stamina < 14) return false;
      fighter.stamina -= 14;
      fighter.action = data.action;
      fighter.actionFrame = 0;
      fighter.x = data.action === 'dodge-left' ? -1 : 1;
      return true;
    }
    const attack = ATTACKS[data.action];
    if (!attack || fighter.action.startsWith('attack-') || fighter.action.startsWith('hit-') || fighter.stamina < attack.cost) return false;
    fighter.stamina -= attack.cost;
    fighter.action = `attack-${data.action}`;
    fighter.actionFrame = 0;
    fighter.x = 0;
    return true;
  }

  connected(seat, connected) {
    const fighter = this.fighter(seat);
    if (!fighter) return false;
    fighter.connected = Boolean(connected);
    if (!connected) {
      fighter.action = 'idle'; fighter.actionFrame = 0; fighter.x = 0;
    }
    return true;
  }

  forfeit(seat) {
    if (this.phase === 'matchover') return false;
    const other = seat === 0 ? 1 : 0;
    if (!this.fighter(other)) return false;
    this.finishMatch(other, `Player ${seat + 1} forfeited`);
    return true;
  }

  leave(seat) {
    if (this.phase !== 'lobby' && this.phase !== 'matchover') this.forfeit(seat);
    this.players[seat] = null;
  }

  step(deltaSeconds = 1 / 30) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || deltaSeconds > 0.25) return this.snapshot();
    this.tick += 1;
    if (this.phase === 'countdown' || this.phase === 'intermission') {
      if (!this.players.every(player => player?.connected)) return this.snapshot();
      this.countdown = this.countdown <= deltaSeconds + 1e-9 ? 0 : this.countdown - deltaSeconds;
      if (this.countdown === 0) this.startRound();
      return this.snapshot();
    }
    if (this.phase !== 'round' || !this.players.every(player => player?.connected)) return this.snapshot();
    this.time += deltaSeconds;
    this.roundSeconds = Math.max(0, this.roundSeconds - deltaSeconds);
    for (const fighter of this.players) {
      if (!fighter) continue;
      if (fighter.hitFlash > 0) fighter.hitFlash = Math.max(0, fighter.hitFlash - deltaSeconds);
      if (fighter.action.startsWith('attack-')) this.stepAttack(fighter);
      else if (fighter.action.startsWith('dodge-')) {
        fighter.actionFrame += 1;
        if (fighter.actionFrame >= 12) { fighter.action = 'idle'; fighter.actionFrame = 0; fighter.x = 0; }
      } else if (fighter.action.startsWith('hit-')) {
        fighter.actionFrame += 1;
        if (fighter.actionFrame >= 10) { fighter.action = 'idle'; fighter.actionFrame = 0; }
      } else {
        fighter.actionFrame += 1;
        fighter.stamina = Math.min(MAX_STAMINA, fighter.stamina + deltaSeconds * 14);
      }
    }
    if (this.phase === 'round' && (this.players[0].health <= 0 || this.players[1].health <= 0)) {
      this.endRound(this.players[0].health <= 0 ? 1 : 0, 'Knockout');
    } else if (this.phase === 'round' && this.roundSeconds <= 0) {
      const [left, right] = this.players.map(player => player.health);
      this.endRound(left === right ? null : left > right ? 0 : 1, left === right ? 'Round drawn' : 'Time');
    }
    return this.snapshot();
  }

  stepAttack(fighter) {
    const move = fighter.action.slice('attack-'.length);
    const attack = ATTACKS[move];
    fighter.actionFrame += 1;
    if (fighter.actionFrame === attack.windup) this.resolveHit(fighter, attack);
    if (fighter.actionFrame >= attack.recovery) {
      fighter.action = 'idle'; fighter.actionFrame = 0;
    }
  }

  resolveHit(attacker, attack) {
    const defender = this.fighter(attacker.seat === 0 ? 1 : 0);
    if (!defender || !defender.connected) return;
    const dodging = defender.action.startsWith('dodge-') && defender.actionFrame <= 10;
    if (dodging) return;
    const correctGuard = (attack.target === 'head' && defender.action === 'guard-high') || (attack.target === 'body' && defender.action === 'guard-low');
    const damage = correctGuard ? Math.ceil(attack.damage * 0.15) : attack.damage;
    defender.health = Math.max(0, defender.health - damage);
    defender.action = correctGuard ? 'hit-block' : 'hit-stun';
    defender.actionFrame = 0;
    defender.x = 0;
    defender.hitFlash = 0.12;
    if (!correctGuard) defender.stamina = Math.max(0, defender.stamina - 6);
  }

  startRound() {
    this.phase = 'round';
    this.roundSeconds = ROUND_SECONDS;
    this.players.forEach(fighter => {
      fighter.health = MAX_HEALTH; fighter.stamina = MAX_STAMINA; fighter.action = 'idle';
      fighter.actionFrame = 0; fighter.x = 0; fighter.hitFlash = 0;
    });
  }

  endRound(winner, reason) {
    if (this.phase !== 'round') return;
    if (winner === 0 || winner === 1) this.rounds[winner] += 1;
    this.result = reason;
    if (this.rounds.some(score => score >= 2) || this.round >= 3) {
      const matchWinner = this.rounds[0] === this.rounds[1] ? null : this.rounds[0] > this.rounds[1] ? 0 : 1;
      this.finishMatch(matchWinner, reason);
    } else {
      this.phase = 'intermission';
      this.countdown = 3;
      this.round += 1;
    }
  }

  finishMatch(winner, reason) {
    this.phase = 'matchover';
    this.winner = winner;
    this.result = reason;
    this.countdown = 0;
  }

  resetMatch() {
    this.phase = 'lobby'; this.round = 1; this.roundSeconds = ROUND_SECONDS;
    this.rounds = [0, 0]; this.winner = null; this.result = ''; this.countdown = 0;
    this.players.forEach(fighter => { fighter.ready = false; fighter.health = MAX_HEALTH; fighter.stamina = MAX_STAMINA; fighter.action = 'idle'; fighter.actionFrame = 0; });
  }

  fighter(seat) { return seat === 0 || seat === 1 ? this.players[seat] : null; }

  snapshot() {
    return {
      game: 'ring-rivals', tick: this.tick, timestamp: Math.round(this.time * 1000),
      phase: this.phase, round: this.round, roundSeconds: Math.ceil(this.roundSeconds),
      countdown: Math.ceil(this.countdown), rounds: [...this.rounds], winner: this.winner,
      result: this.result, players: this.players.map(player => player && { ...player }),
    };
  }
}
