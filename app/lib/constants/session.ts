// Admin session timing. Shared by the auth API routes (server) and the
// SessionTimeout component (client), so keep this file free of server-only imports.

/** Signed out after this long with no mouse/keyboard/touch activity in any tab. */
export const SESSION_IDLE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours

/** The "you're about to be signed out" dialog opens this long before the idle timeout. */
export const SESSION_WARNING_MS = 60 * 1000; // 1 minute

/** Hard cap: a session can't be kept alive past this, however active the user is. */
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

/** While the user is active, the client re-extends the server session at most this often. */
export const SESSION_REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Server token/cookie lifetime per refresh. Slightly longer than the idle timeout so the
 * client-side timer (which also covers the refresh throttle) always fires first and the
 * user sees the warning dialog instead of a silent 401.
 */
export const SESSION_TOKEN_TTL_MS = SESSION_IDLE_TIMEOUT_MS + 2 * SESSION_REFRESH_INTERVAL_MS;
