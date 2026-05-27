import mongoose from "mongoose";
import { env } from "@/config/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // Reuse one connection across hot reloads so Next.js dev mode does not exhaust MongoDB connections.
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (process.env.NODE_ENV !== "production") {
  globalThis.mongooseCache = cache;
}

export async function connectToDatabase() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to connect to the database");
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    // The promise cache prevents concurrent requests from opening duplicate connections during hot reload.
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}