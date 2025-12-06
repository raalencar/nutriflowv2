import { db } from '../db';
import { users } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function seedUsers() {
    console.log('🌱 Seeding users with generic data...');

    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
        // Only update if missing critical HR data (e.g. CPF)
        if (!user.cpf) {
            console.log(`Updating user: ${user.email}`);

            await db.update(users).set({
                cpf: '123.456.789-00',
                rg: '12.345.678-9',
                birthDate: '1990-01-01',
                phone: '(11) 99999-9999',
                pis: '123.45678.90-1',

                addressZip: '01001-000',
                addressStreet: 'Rua Exemplo',
                addressNumber: '123',
                addressComp: 'Apto 1',
                addressDistrict: 'Centro',
                addressCity: 'São Paulo',
                addressState: 'SP',

                admissionDate: '2024-01-01',
                hourlyRate: '25.00',
                workSchedule: {
                    type: 'standard',
                    startTime: '08:00',
                    endTime: '17:00',
                    workDays: [1, 2, 3, 4, 5]
                }
            }).where(eq(users.id, user.id));
        }
    }

    console.log('✅ Users updated successfully.');
    process.exit(0);
}

seedUsers().catch(console.error);
