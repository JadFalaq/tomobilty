const request = require('supertest');
const app = require('../../backend/api/index');
const prisma = require('../../backend/src/config/prisma');

describe('Auth flow', () => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'StrongPass123';
  let hasRefreshTable = false;

  beforeAll(async () => {
    try {
      const r = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM information_schema.tables WHERE table_schema='public' AND table_name='refresh_token'`;
      hasRefreshTable = !!(r && r[0] && r[0].cnt === 1);
    } catch (_) {
      hasRefreshTable = false;
    }
  });

  afterAll(async () => {
    try {
      if (hasRefreshTable && prisma.refreshToken) {
        const u = await prisma.user.findFirst({ where: { email }, select: { id: true } });
        if (u) {
          await prisma.refreshToken.deleteMany({ where: { user_id: u.id } });
        }
      }
    } catch (_) {}
    await prisma.user.deleteMany({ where: { email } });
  });

  it('registers and logs in, returns tokens', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, mot_de_passe: password, nom: 'Test', prenom: 'User' })
      .expect(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.tokens.refresh).toBeDefined();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, mot_de_passe: password })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.access).toBeDefined();
    expect(res.body.data.tokens.refresh).toBeDefined();
  });

  (hasRefreshTable && prisma.refreshToken ? it : it.skip)('refresh rotates and reuse of old token fails', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, mot_de_passe: password })
      .expect(200);
    const tokenA = login.body.data.tokens.refresh;

    const r1 = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: tokenA })
      .expect(200);
    const tokenB = r1.body.data.tokens.refresh;
    expect(tokenB).toBeDefined();

    const r2 = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: tokenA })
      .expect(401);
    expect(r2.body.success).toBe(false);
    expect(r2.body.error.code).toBe('AUTH_REFRESH_REUSED');
  });
});
