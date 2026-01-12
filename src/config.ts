/**
 * Application configuration
 *
 * In production, the frontend is served from the same server as the API,
 * so we use empty string (same origin) for API_BASE.
 *
 * In development, the frontend runs on localhost:5173 and the API on localhost:3001,
 * so we need to specify the full API URL.
 */
export const API_BASE = import.meta.env.PROD ? "" : "http://localhost:3001";
