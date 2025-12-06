
import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';
import readline from 'readline';

if (!process.env.CLERK_SECRET_KEY) {
    console.error('Erro: CLERK_SECRET_KEY não encontrada no arquivo .env');
    process.exit(1);
}

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
    console.log('🔄 Buscando usuários do Clerk...');

    try {
        const response = await clerkClient.users.getUserList({
            limit: 100,
        });

        const users = response.data;

        if (users.length === 0) {
            console.log('⚠️ Nenhum usuário encontrado.');
            return;
        }

        console.log('\n📋 Usuários Encontrados:');
        users.forEach((user, index) => {
            const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 'Sem email';
            const role = (user.publicMetadata?.role as string[] | undefined)?.join(', ') || 'Sem cargo';
            console.log(`${index + 1}. [${user.id}] ${user.firstName} ${user.lastName} (${email}) - Cargo: ${role}`);
        });

        console.log('\n📋 Usuários Encontrados:', JSON.stringify(users, null, 2));

        const targetUserId = "user_36QdH9PbeRp9ipIvP7GZCNlr63l";
        console.log(`\nPromovendo usuário ${targetUserId} a ADMIN...`);

        try {
            await clerkClient.users.updateUser(targetUserId, {
                publicMetadata: {
                    role: ['admin']
                }
            });
            console.log('✅ Sucesso! Usuário Rafael Alencar atualizado para ADMIN.');
        } catch (err) {
            console.error('Erro ao atualizar usuário:', err);
        }
        process.exit(0);

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        process.exit(1);
    }
}

main();
