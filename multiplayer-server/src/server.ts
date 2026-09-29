import metadata from "../../package.json" with { type: "json" };
import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Room, Server, ServerError, matchMaker, type Client } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { DrawingRoom } from "./drawing-room.js";
import { SumoRoom } from "./sumo-room.js";
import { Gauntlet2DRoom } from "./gauntlet2d-room.js";
import { GardenRoom } from "./garden-room.js";
import { GauntletRoom } from "./gauntlet-room.js";

const instance = randomUUID();
const defaultMatchmaking = matchMaker.controller.invokeMethod.bind(matchMaker.controller);
matchMaker.controller.invokeMethod = async (method, room, options, auth) => {
  if (room !== "feasibility") throw new ServerError(403, "Use the game's join endpoint");
  return defaultMatchmaking(method, room, options, auth);
};
const games = new Map<string, typeof DrawingRoom | typeof SumoRoom | typeof GardenRoom | typeof Gauntlet2DRoom | typeof GauntletRoom>([["multiplayer-draw", DrawingRoom], ["sumo-battle", SumoRoom], ["garden-chat", GardenRoom], ["gauntlet-2d", Gauntlet2DRoom], ["gauntlet-3d", GauntletRoom]]);
let joining: Promise<unknown> = Promise.resolve();
class FullRoomError extends Error {}
async function reserve(game: string) {
  // Serialize local creation/reservation so simultaneous arrivals do not create overflow rooms.
  const pending = joining.catch(() => undefined).then(async () => {
    const existing = (await matchMaker.query({ name: game }))[0];
    const room = existing || await matchMaker.createRoom(game, {});
    if (room.locked || room.clients >= room.maxClients) throw new FullRoomError();
    return matchMaker.joinById(room.roomId);
  });
  joining = pending;
  return pending;
}
class ProbeRoom extends Room {
  maxClients = 12;
  onCreate() {
    this.onMessage("probe", (client: Client, message: unknown) => {
      if (typeof message !== "string" || message.length > 100) return;
      this.broadcast("probe", { nonce: message, sender: client.sessionId, room: this.roomId, instance });
    });
  }
}
const httpServer = createServer();
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer, maxPayload: 16384, pingInterval: 3000, pingMaxRetries: 2 }),
  express: (app) => {
    app.use(express.json({ limit: "16kb" }));
    app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") { res.sendStatus(204); return; }
      next();
    });
    app.get("/api/health", (_req, res) => res.json({ status: "ok", version: metadata.version, instance, games: [...games.keys()] }));
    app.post("/api/join/:game", async (req, res) => {
      if (!games.has(req.params.game)) { res.status(404).json({ error: "Unknown game" }); return; }
      try { res.json(await reserve(req.params.game)); }
      catch (error) {
        if (error instanceof FullRoomError) res.status(409).json({ error: "Room full" });
        else { console.error("Join failed", (error as Error).message); res.status(503).json({ error: "Room temporarily unavailable" }); }
      }
    });
    app.use("/matchmake", (req, res, next) => {
      if (req.path.endsWith("/feasibility")) next();
      else res.status(403).json({ error: "Use the game's join endpoint" });
    });
  },
});
for (const [name, room] of games) gameServer.define(name, room);
gameServer.define("feasibility", ProbeRoom);
const server = await gameServer.serverless();
if (!process.env.VERCEL) server.listen(Number(process.env.PORT) || 2567, "0.0.0.0");
export default server;





