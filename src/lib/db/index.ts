import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Validate environment variable
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// Connection pool configuration for optimal performance
const connectionString = process.env.DATABASE_URL;

// Create postgres client with connection pooling
const client = postgres(connectionString, {
    max: 10,                    // Maximum connections in pool
    idle_timeout: 20,           // Close idle connections after 20s
    connect_timeout: 10,        // Connection timeout in seconds
    prepare: false,             // Required for Supabase pooler (transaction mode)
});

// Export Drizzle instance
export const db = drizzle(client);

// Export client for raw queries if needed
export { client };
