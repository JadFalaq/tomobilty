const request = require('supertest');
const app = require('../../backend/api/index');
const prisma = require('../../backend/src/config/prisma');

describe('GET /api/users/profile', () => {
  const email = `profile_tester_${Date.now()}@example.com`;
  const password = 'StrongPass123';
  let accessToken;
  let userId;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, mot_de_passe: password, nom: 'Profil', prenom: 'Tester' })
      .expect(201);
    expect(reg.body.success).toBe(true);
    userId = reg.body.data.user.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, mot_de_passe: password })
      .expect(200);
    expect(login.body.success).toBe(true);
    accessToken = login.body.data.tokens.access;
  });

  afterAll(async () => {
    try {
      await prisma.refreshToken.deleteMany({ where: { user_id: userId } });
    } catch (_) {}
    await prisma.user.deleteMany({ where: { email } });
  });

  it('returns current user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    const user = res.body.data.user;
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.nom).toBe('Profil');
    expect(user.prenom).toBe('Tester');
  });

  it('fails without authentication', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .expect(401);
    expect(res.body.success).toBe(false);
  });
});
