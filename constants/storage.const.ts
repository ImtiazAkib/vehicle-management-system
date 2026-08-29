/**
 * How much the bucket may hold, and what is done to a file on the way in to keep it under that.
 *
 * The cap itself is an environment variable, not a constant here — it differs per deployment the same way
 * `MONGODB_URI` does. See `STORAGE_CAP_BYTES` in `env/server.ts`. What lives here is the policy that does
 * not move between deployments: when to warn, when to refuse, and how hard to squeeze each upload. The
 * storage guard reads these from step 9.
 */
export const STORAGE = {
  /** Warn the uploader once usage crosses this share of the cap — a soft line; the upload still goes through. */
  WARN_RATIO: 0.85,

  /** Refuse new uploads once usage reaches this share of the cap — short of 1.0 on purpose, the last slice is headroom. */
  BLOCK_RATIO: 0.95,

  /** How long a usage reading is trusted before it is measured again, in milliseconds. */
  USAGE_CACHE_MS: 5000,

  /** The longest edge an uploaded image is resized down to, in pixels. */
  IMAGE_MAX_DIMENSION: 2000,

  /**
   * The largest input image `sharp` will decode, in pixels — a guard against a decompression bomb, a
   * small file that declares an enormous canvas and blows up to gigabytes once decoded.
   */
  IMAGE_MAX_INPUT_PIXELS: 50 * 1000 * 1000,

  /** The WebP quality every uploaded image is re-encoded at. */
  IMAGE_WEBP_QUALITY: 80,
} as const;

/**
 * The MIME types stored as they arrive, never gzipped.
 *
 * Each is already a compressed container, so a second pass spends CPU only to grow the file by a gzip
 * header. Images never reach this list — they are re-encoded to WebP before the compression branch runs.
 */
export const STORAGE_INCOMPRESSIBLE_MIME_TYPES = [
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;
