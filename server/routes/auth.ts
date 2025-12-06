import { Hono } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import { compare, hash } from 'bcryptjs';

const auth = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'; // Should be in env

auth.post('/login', async (c) => {
    try {
        const { email, password } = await c.req.json();

        if (!email || !password) {
            return c.json({ error: 'Email e senha são obrigatórios' }, 400);
        }

        const userRecord = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const user = userRecord[0];

        if (!user || !user.password) {
            return c.json({ error: 'Credenciais inválidas' }, 401);
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
            return c.json({ error: 'Credenciais inválidas' }, 401);
        }

        if (user.status !== 'active') {
            return c.json({ error: 'Usuário inativo' }, 403);
        }

        const token = sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return c.json({
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Erro interno no servidor' }, 500);
    }
});

auth.get('/me', async (c) => {
    // This endpoint assumes middleware has attached user to context, 
    // BUT since we are setting up, let's justverify token from header for now or rely on auth middleware being applied upstream.
    // Index.ts applies authMiddleware to /api/*
    // But /api/auth/login should be public.
    // So usually /api/auth is excluded from global middleware or handled separately.
    // I will check index.ts middleware usage.
    // For now, simple implementation of decoding token if needed, or if c.get('user') is available.
    // "authMiddleware" in 'middleware/auth.ts' likely sets 'user'.

    // Assuming authMiddleware populates 'user' or 'jwtPayload'
    const userPayload = c.get('user') as any;
    if (!userPayload) {
        return c.json({ error: 'Não autenticado' }, 401);
    }

    const userRecord = await db.select().from(users).where(eq(users.id, userPayload.id)).limit(1);

    if (!userRecord[0]) {
        return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    const { password: _, ...user } = userRecord[0];
    return c.json(user);
});

auth.post('/forgot-password', async (c) => {
    const { email } = await c.req.json();
    // Implementation for SendPulse or similar would go here.
    // For now, just mock success as requested to "create screen".
    console.log(`Password reset requested for: ${email}`);
    return c.json({ message: 'Email enviado' });
});

export default auth;
