import { createHash, randomUUID } from "node:crypto";

export type Identity = {
  id: string;
  hash: string;
  number: number;
  generation: string;
  connected: boolean;
  claimed?: boolean;
  admittedAt?: number;
};
export type Registry = {
  epoch: string;
  code: string;
  hostId: string;
  revision: number;
  serial: number;
  created: number;
  ended: boolean;
  identities: Identity[];
};
export interface ContinuityStore {
  read(code: string): Promise<{ value: Registry; etag: string } | null>;
  write(code: string, value: Registry, etag?: string): Promise<boolean>;
  get(key: string): Promise<any>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
}
export class RelayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const identityHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const roomKey = (r: Registry, suffix: string) => `${r.epoch}:${suffix}`;
export const publicPresence = (r: Registry) => ({
  hostId: r.hostId,
  serial: r.serial,
  capacity: 4,
  players: r.identities
    .filter((p) => p.connected)
    .map((p) => ({ id: p.id, number: p.number, host: p.id === r.hostId })),
});

/** Blob CAS owns admission; ephemeral cache never elects or creates a host. */
export class AsteroidsContinuity {
  constructor(
    public store: ContinuityStore,
    public now = () => Date.now(),
  ) {}
  async current(code: string) {
    const record = await this.store.read(code);
    if (!record || record.value.ended)
      throw new RelayError(404, "Room expired or code not found");
    return record;
  }
  async mutate(code: string, update: (r: Registry) => void) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const record = await this.current(code);
      const r = structuredClone(record.value);
      update(r);
      r.revision++;
      if (await this.store.write(code, r, record.etag)) {
        // Immutable revisions prevent a delayed writer overwriting newer membership.
        await this.store.set(roomKey(r, `registry:${r.revision}`), r, 600);
        return r;
      }
    }
    throw new RelayError(409, "Room changed while joining. Try again.");
  }
  async admit(data: {
    create?: boolean;
    code?: string;
    identityToken?: string;
    renew?: boolean;
    generation?: string;
  }) {
    if (!data || typeof data !== "object")
      throw new RelayError(400, "Choose create or enter a room code");
    if (data.code !== undefined && typeof data.code !== "string")
      throw new RelayError(400, "Enter a four-character room code");
    let code = data.code?.trim().toUpperCase();
    if (code !== undefined && !/^[A-Z0-9]{4}$/.test(code))
      throw new RelayError(400, "Enter a four-character room code");
    let token = data.identityToken;
    if (
      token !== undefined &&
      (typeof token !== "string" || token.length > 128)
    )
      throw new RelayError(403, "Invalid recovery identity");
    let r: Registry;
    if (data.create === true) {
      token = randomUUID();
      const id = randomUUID();
      const identity: Identity = {
        id,
        hash: identityHash(token),
        number: 1,
        generation: randomUUID(),
        connected: true,
        admittedAt: this.now(),
      };
      for (let tries = 0; ; tries++) {
        const candidate =
          code ?? randomUUID().replaceAll("-", "").slice(0, 4).toUpperCase();
        r = {
          epoch: randomUUID(),
          code: candidate,
          hostId: id,
          revision: 1,
          serial: 1,
          created: this.now(),
          ended: false,
          identities: [identity],
        };
        if (await this.store.write(candidate, r)) break;
        if (code || tries >= 12)
          throw new RelayError(409, "That room code is already in use");
      }
      await this.store.set(roomKey(r!, "registry:1"), r!, 600);
    } else {
      if (!code) throw new RelayError(400, "Enter a room code");
      const initial = (await this.current(code)).value;
      await this.assertAlive(initial);
      const supplied = token !== undefined;
      token ??= randomUUID();
      const hash = identityHash(token);
      r = await this.mutate(code, (value) => {
        for (const pending of value.identities) {
          if (
            pending.connected &&
            !pending.claimed &&
            this.now() - (pending.admittedAt ?? value.created) > 15000 &&
            pending.id !== value.hostId
          ) {
            pending.connected = false;
            value.serial++;
          }
        }
        let p = value.identities.find((p) => p.hash === hash);
        if (supplied && !p)
          throw new RelayError(403, "Invalid recovery identity");
        if (p?.id === value.hostId && !data.renew)
          throw new RelayError(
            410,
            "The host cannot leave and return to a running session",
          );
        if (data.renew && (!p?.connected || p.generation !== data.generation))
          throw new RelayError(403, "Invalid connection renewal");
        if (
          !data.renew &&
          value.identities.filter((p) => p.connected && p.hash !== hash)
            .length >= 4
        )
          throw new RelayError(409, "Room full");
        if (!p) {
          if (value.identities.length >= 128)
            throw new RelayError(429, "Session identity limit reached");
          const occupied = new Set(
            value.identities.filter((p) => p.connected).map((p) => p.number),
          );
          let number = 1;
          while (occupied.has(number)) number++;
          p = {
            id: randomUUID(),
            hash,
            number,
            generation: "",
            connected: false,
          };
          value.identities.push(p);
        }
        if (!p.connected) {
          const occupied = new Set(
            value.identities
              .filter((other) => other.connected)
              .map((other) => other.number),
          );
          let number = 1;
          while (occupied.has(number)) number++;
          p.number = number;
          value.serial++;
        }
        p.connected = true;
        p.generation = randomUUID();
        p.claimed = false;
        p.admittedAt = this.now();
      });
    }
    const p = r!.identities.find((p) => p.hash === identityHash(token!))!;
    return {
      code: r!.code,
      token,
      id: p.id,
      host: p.id === r!.hostId,
      generation: p.generation,
      epoch: r!.epoch,
      transport: "asteroids-shared-v1",
      renewAfterMs: 210000,
    };
  }
  async authenticate(code: string, token: string, generation: string) {
    const hash = identityHash(token);
    const r = await this.mutate(code, (value) => {
      const p = value.identities.find((p) => p.hash === hash);
      if (
        !p?.connected ||
        p.generation !== generation ||
        p.claimed ||
        this.now() - (p.admittedAt ?? value.created) > 15000
      )
        throw new RelayError(403, "Connection expired or already claimed");
      p.claimed = true;
    });
    return {
      registry: r,
      identity: r.identities.find((p) => p.hash === hash)!,
    };
  }
  async assertAlive(r: Registry) {
    const frame = await this.store.get(roomKey(r, "frame"));
    if (
      (frame && this.now() - frame.at < 12000) ||
      this.now() - r.created < 15000
    )
      return;
    // Cache loss fails closed; it cannot create a second world or reset a run.
    await this.end(r.code, r.epoch);
    throw new RelayError(
      410,
      "The host is no longer connected. Create a new room.",
    );
  }
  async end(code: string, epoch: string) {
    return this.mutate(code, (r) => {
      if (r.epoch !== epoch) throw new RelayError(410, "Session changed");
      r.ended = true;
      r.serial++;
    });
  }
  async leave(code: string, id: string, generation: string) {
    const record = await this.current(code);
    const p = record.value.identities.find((p) => p.id === id);
    if (!p?.connected || p.generation !== generation) return;
    await this.mutate(code, (r) => {
      const member = r.identities.find((p) => p.id === id)!;
      if (member.generation !== generation || !member.connected) return;
      member.connected = false;
      r.serial++;
      if (id === r.hostId) r.ended = true;
    });
  }
}

/** Test-only injected store. Production never falls back to process memory. */
export class MemoryContinuityStore implements ContinuityStore {
  records = new Map<string, { value: Registry; etag: string }>();
  cache = new Map<string, unknown>();
  async read(code: string) {
    return structuredClone(this.records.get(code) ?? null);
  }
  async write(code: string, value: Registry, etag?: string) {
    const current = this.records.get(code);
    if (etag ? current?.etag !== etag : current !== undefined) return false;
    this.records.set(code, {
      value: structuredClone(value),
      etag: randomUUID(),
    });
    return true;
  }
  async get(key: string) {
    return structuredClone(this.cache.get(key));
  }
  async set(key: string, value: unknown) {
    this.cache.set(key, structuredClone(value));
  }
}
