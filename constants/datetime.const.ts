/**
 * The platform's timezone. Every date the app renders is formatted in it, so a booking at 19:30 reads
 * 19:30 regardless of where the server runs or where the visitor is — and, more to the point, "is this
 * maintenance overdue" is a question only a fixed timezone can answer the same way twice.
 *
 * One operator, one timezone — that is the scope decision, not an oversight. It is read from here in
 * exactly one place per formatter, so a different operator is a one-line change rather than a search for
 * hardcoded offsets.
 */
export const DEFAULT_TIMEZONE = 'Asia/Dhaka';
