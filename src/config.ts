/**
 * Convertly Client Runtime Configuration
 * Supports decoupled deployment where the FastAPI backend is hosted on a separate origin.
 */

export const API_BASE_URL: string = (
  (import.meta as any).env?.VITE_API_BASE_URL || ''
).replace(/\/$/, '');
