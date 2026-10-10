import { connectSharedAsteroids } from "./asteroids-shared-connection.js";
import { Client } from "@colyseus/sdk";
/** Isolated API: existing games keep their connection/retry behavior. */
export async function connectAsteroids({
  endpoint,
  create = false,
  code,
  onPresence,
  onState,
  onInput,
  onEnded,
  onStatus,
}) {
  const base = endpoint.replace(/\/$/, "");
  const storageKey = `asteroids:${base}:${code || "new"}`;
  let token = create
    ? undefined
    : sessionStorage.getItem(storageKey) || undefined;
  const response = await fetch(`${base}/api/join/asteroids-coop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ create, code, identityToken: token }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not join room");
  token = data.token;
  sessionStorage.setItem(`asteroids:${base}:${data.code}`, token);
  if (data.transport === "asteroids-shared-v1")
    return connectSharedAsteroids(base, data, {
      onPresence,
      onState,
      onInput,
      onEnded,
      onStatus,
    });
  const room = await new Client(base).consumeSeatReservation(data.reservation);
  room.reconnection.enabled = false;
  let intentional = false,
    terminal = false;
  room.onMessage("identity", () => {});
  room.onMessage("presence", onPresence);
  room.onMessage("gameState", onState);
  room.onMessage("input", onInput);
  room.onMessage("sessionEnded", (value) => {
    terminal = true;
    onEnded(value.reason);
  });
  room.onError((_code, message) => onStatus?.(message));
  room.onLeave(() => {
    if (!intentional && !terminal)
      onEnded(
        "Connection lost. Guests may rejoin with the room code; host loss ends the session.",
      );
  });
  room.send("snapshot");
  return {
    id: data.id,
    code: data.code,
    host: create,
    input: (value) => room.send("input", value),
    publish: (value) => room.send("hostSnapshot", value),
    leave: () => {
      intentional = true;
      return room.leave();
    },
  };
}
