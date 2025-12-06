import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './db/schema';

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('❌ FATAL: DATABASE_URL environment variable is not set!');
    console.error('Please configure DATABASE_URL in your Railway environment variables.');
    throw new Error('Missing DATABASE_URL configuration');
}

neonConfig.webSocketConstructor = ws;

let db: ReturnType<typeof drizzle>;

try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log('✅ Database connection initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize database connection:', error);
    throw error;
}

export { db };
