import { db } from '../db';
import { users } from '../db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

const USERS_TO_SEED = [
    { email: 'mnv@rd7solucoes.com.br', name: 'MNV User', role: 'operator' },
    { email: 'prr@rd7solucoes.com.br', name: 'PRR User', role: 'operator' },
    { email: 'mrc@rd7solucoes.com.br', name: 'MRC User', role: 'operator' },
];

async function seedUsers() {
    const password = 'Rd7@2025';
    const hashedPassword = await hash(password, 10);

    for (const userData of USERS_TO_SEED) {
        console.log(`Processing ${userData.email}...`);
        const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);

        if (existingUser.length > 0) {
            console.log(`User ${userData.email} exists. Updating password...`);
            await db.update(users).set({
                password: hashedPassword,
                status: 'active'
            }).where(eq(users.email, userData.email));
        } else {
            console.log(`Creating user ${userData.email}...`);
            await db.insert(users).values({
                id: crypto.randomUUID(),
                email: userData.email,
                name: userData.name,
                password: hashedPassword,
                role: userData.role as any,
                status: 'active'
            });
        }
    }
    console.log('Done!');
    process.exit(0);
}

seedUsers().catch((err) => {
    console.error('Error seeding users:', err);
    process.exit(1);
});
