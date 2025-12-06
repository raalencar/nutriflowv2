import { db } from '../db';
import { users } from '../db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createAdmin() {
    const email = 'admin@rd7solucoes.com.br';
    const password = '123456';
    const hashedPassword = await hash(password, 10);

    console.log(`Checking for user ${email}...`);
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
        console.log('User already exists. Updating password and role...');
        await db.update(users).set({
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            name: 'Admin Master'
        }).where(eq(users.email, email));
        console.log('User updated.');
    } else {
        console.log('User does not exist. Creating...');
        // ID should be a string, usually from Clerk, but now we generate one or use email as ID or random UUID.
        // Schema says: id: text('id').primaryKey()
        // I'll make a UUID for it.
        const id = crypto.randomUUID();

        await db.insert(users).values({
            id,
            email,
            password: hashedPassword,
            role: 'admin', // Enums are string literals
            status: 'active',
            name: 'Admin Master'
        });
        console.log('User created.');
    }
    process.exit(0);
}

createAdmin().catch((err) => {
    console.error('Error creating admin:', err);
    process.exit(1);
});
