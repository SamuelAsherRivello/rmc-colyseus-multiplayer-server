import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Room, Server, type Client } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";

const instance = randomUUID();
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
  transport: new WebSocketTransport({ server: httpServer }),
  express: (app) => {
    app.use(express.json({ limit: "16kb" }));
    app.get("/api/health", (_req, res) => res.json({ status: "ok", stage: "feasibility", instance }));
  },
});
gameServer.define("feasibility", ProbeRoom);
const server = await gameServer.serverless();
if (!process.env.VERCEL) {
  server.listen(Number(process.env.PORT) || 2567, "0.0.0.0");
}
export default server;


