import mongoose, { Model, Schema, Types } from 'mongoose';

/*
  Imported from the constant module directly, never the `@/constants` barrel. The barrel re-exports
  `home.const.ts`, which drags in `lucide-react` — dead weight anywhere the limiter runs (a script, the
  guard on a route), and this model is one the guard imports directly for exactly that reason: it is
  infrastructure, not a domain surface, so it is deliberately absent from `models/index.ts`.
*/
import { RATE_LIMIT_COLLECTION } from '@/constants/rate-limit.const';

/**
 * One fixed-window counter.
 *
 * The counts live in the database rather than in memory, and that is the whole point of the model
 * existing: an in-process `Map` would reset on every deploy and count separately per instance. A row here
 * behaves the same on one server or ten.
 */
export type RateLimitAttributes = {
  /**
   * What is being counted, as `action:hash`. Hashed, never raw — the limiter only ever asks "have I seen
   * this exact key this window", which a digest answers as well as the value would, and the `action`
   * prefix keeps two budgets for one caller apart.
   */
  key: string;
  /** How many attempts have landed in the current window. */
  count: number;
  /** When this window may be swept. The TTL index below sweeps it once it is in the past. */
  expiresAt: Date;
};

export type RateLimitEntity = RateLimitAttributes & { _id: Types.ObjectId };

type RateLimitModel = Model<RateLimitAttributes>;

const rateLimitSchema = new Schema<RateLimitAttributes, RateLimitModel>(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 200 },
    count: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false, collection: RATE_LIMIT_COLLECTION }
);

/*
  The collection cleans itself. `expireAfterSeconds: 0` means "sweep once `expiresAt` is in the past", not
  "keep for zero seconds" — the field carries the deadline. Without this the counters accumulate one
  document per distinct caller per window, and the limiter becomes the storage problem it was meant to
  prevent.
*/
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Guarded so a hot reload re-uses the compiled model instead of redefining it.
export const RateLimit =
  (mongoose.models.RateLimit as RateLimitModel) ?? mongoose.model<RateLimitAttributes, RateLimitModel>('RateLimit', rateLimitSchema);
