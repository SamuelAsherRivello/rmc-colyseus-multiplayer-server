export type TransferableState = { state: unknown; random: unknown; clock: unknown; sequence: number; timestamp: number };

type Participant = { order: number; active: boolean; lastSeen: number };

/** Small, game-neutral authority election for participant-hosted simulations. */
export class ParticipantHostRelay {
  private readonly participants = new Map<string, Participant>();
  private nextOrder = 0;
  private hostId: string | null = null;
  private latest: TransferableState | null = null;

  join(id: string, now = Date.now()) {
    this.participants.set(id, { order: ++this.nextOrder, active: true, lastSeen: now });
    return this.elect();
  }

  leave(id: string) { this.participants.delete(id); return this.elect(); }

  touch(id: string, now = Date.now()) {
    const participant = this.participants.get(id);
    if (!participant) return false;
    participant.active = true;
    participant.lastSeen = now;
    return this.elect().changed;
  }

  expire(now = Date.now(), timeoutMs = 15_000) {
    for (const participant of this.participants.values()) {
      if (now - participant.lastSeen > timeoutMs) participant.active = false;
    }
    return this.elect();
  }

  publish(id: string, data: Omit<TransferableState, "sequence" | "timestamp">, now = Date.now()) {
    if (id !== this.hostId || !this.participants.get(id)?.active) return null;
    this.latest = { ...data, sequence: (this.latest?.sequence ?? 0) + 1, timestamp: now };
    return this.latest;
  }

  get host() { return this.hostId; }
  get transfer() { return this.latest; }
  get size() { return this.participants.size; }

  private elect() {
    const previous = this.hostId;
    this.hostId = [...this.participants.entries()]
      .filter(([, participant]) => participant.active)
      .sort(([, a], [, b]) => a.order - b.order)[0]?.[0] ?? null;
    return { hostId: this.hostId, changed: previous !== this.hostId, transfer: this.latest };
  }
}
