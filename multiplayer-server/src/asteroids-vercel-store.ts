import { get, put, BlobPreconditionFailedError, BlobError } from "@vercel/blob";
import { getCache } from "@vercel/functions";
import type { ContinuityStore, Registry } from "./asteroids-continuity.js";

export class VercelAsteroidsStore implements ContinuityStore {
  private cache = getCache({ namespace: "rmc-asteroids-shared-v1" });
  private path(code: string) {
    return `asteroids/rooms/${code}.json`;
  }
  async read(code: string) {
    const result = await get(this.path(code), {
      access: "private",
      useCache: false,
    });
    if (!result) return null;
    if (result.statusCode !== 200)
      throw new Error("Unexpected registry response");
    return {
      value: (await new Response(result.stream).json()) as Registry,
      etag: result.blob.etag,
    };
  }
  async write(code: string, value: Registry, etag?: string) {
    try {
      await put(this.path(code), JSON.stringify(value), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
        allowOverwrite: etag !== undefined,
        ...(etag ? { ifMatch: etag } : {}),
      });
      return true;
    } catch (error) {
      if (
        error instanceof BlobPreconditionFailedError ||
        (error instanceof BlobError && /already exists/i.test(error.message))
      )
        return false;
      throw error;
    }
  }
  async get(key: string) {
    return this.cache.get(key);
  }
  async set(key: string, value: unknown, ttl = 30) {
    await this.cache.set(key, value, { ttl });
  }
}
