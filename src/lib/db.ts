/**
 * @deprecated This file is no longer used. Prisma has been removed from the client.
 * 
 * Database access now happens through:
 * 1. REST API endpoints (see $lib/config.ts for API_URL)
 * 2. Socket.IO for real-time updates
 * 
 * If you see imports from this file, they need to be migrated to use the REST API.
 * 
 * See MIGRATION_DOCUMENTATION.md for details on the new architecture.
 */

// Export a stub to prevent import errors
export const db = new Proxy({} as any, {
  get() {
    throw new Error(
      'lib/db.ts is deprecated. Use REST API (import { API_URL } from "$lib/config") or Socket.IO instead.'
    );
  }
});
