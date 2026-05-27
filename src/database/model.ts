import mongoose, { type Model, type Schema } from "mongoose";

// Next.js hot reload can re-run modules many times, so this helper reuses existing models instead of redefining them.
export function getModel<T>(modelName: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[modelName] as Model<T>) ?? mongoose.model<T>(modelName, schema);
}