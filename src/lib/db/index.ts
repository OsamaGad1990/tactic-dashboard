import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

// Lazy initialization - only create connection when needed
let _client: Sql | null = null;
let _db: PostgresJsDatabase | null = null;

/**
 * Get PostgreSQL client (singleton, lazy initialized)
 */
export function getClient(): Sql {
    if (!_client) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        _client = postgres(connectionString, {
            max: 10,                    // Maximum connections in pool
            idle_timeout: 20,           // Close idle connections after 20s
            connect_timeout: 10,        // Connection timeout in seconds
            prepare: false,             // Required for Supabase pooler (transaction mode)
        });
    }
    return _client;
}

/**
 * Get Drizzle ORM instance (singleton, lazy initialized)
 */
export function getDb(): PostgresJsDatabase {
    if (!_db) {
        _db = drizzle(getClient());
    }
    return _db;
}

// Export for backward compatibility - these will be lazily initialized on first access
export const client = new Proxy({} as Sql, {
    get(_, prop) {
        return Reflect.get(getClient(), prop);
    },
    apply(_, __, args) {
        return (getClient() as unknown as (...args: unknown[]) => unknown)(...args);
    },
});

export const db = new Proxy({} as PostgresJsDatabase, {
    get(_, prop) {
        return Reflect.get(getDb(), prop);
    },
});
