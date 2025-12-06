
import 'dotenv/config';
import { db } from '../db';
import { users } from '../db/schema';

async function main() {
    console.log('Checking local users table...');
    const allUsers = await db.select().from(users);
    console.table(allUsers);

    const rafael = allUsers.find(u => u.email === 'rafa0710@gmail.com');
    if (rafael) {
        console.log(`\nUser Rafael found in local DB. Role: ${rafael.role}`);
    } else {
        console.log('\nUser Rafael NOT found in local DB.');
    }
    process.exit(0);
}

main().catch(console.error);
