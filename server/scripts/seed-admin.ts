
import 'dotenv/config';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const adminUser = {
        id: "user_36QdH9PbeRp9ipIvP7GZCNlr63l",
        email: "rafa0710@gmail.com",
        name: "Rafael Alencar",
        role: "admin" as const, // Cast to enum type
        status: "active" as const
    };

    console.log(`Seeding admin user: ${adminUser.email}...`);

    try {
        // Check if exists
        const existing = await db.select().from(users).where(eq(users.id, adminUser.id));

        if (existing.length > 0) {
            console.log('User already exists in local DB. Updating role to admin...');
            await db.update(users)
                .set({ role: 'admin' })
                .where(eq(users.id, adminUser.id));
        } else {
            console.log('Inserting new admin user...');
            await db.insert(users).values(adminUser);
        }
        console.log('✅ Admin user seeded successfully.');
    } catch (e) {
        console.error('Error seeding admin:', e);
    }
    process.exit(0);
}

main();
