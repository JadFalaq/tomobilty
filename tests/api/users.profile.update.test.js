const request = require('supertest');
const app = require('../../backend/api/index');
const prisma = require('../../backend/src/config/prisma');

describe('PUT /api/users/profile', () => {
  const email = `profile_update_${Date.now()}@example.com`;
  const password = 'StrongPass123';
  let accessToken;
  let userId;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, mot_de_passe: password, nom: 'Update', prenom: 'Tester', telephone: '+212600000000' })
      .expect(201);
    userId = reg.body.data.user.id;
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, mot_de_passe: password })
      .expect(200);
    accessToken = login.body.data.tokens.access;
  });

  afterAll(async () => {
    try {
      await prisma.refreshToken.deleteMany({ where: { user_id: userId } });
    } catch (_) {}
    await prisma.user.deleteMany({ where: { email } });
  });

  it('updates profile fields for authenticated user', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        telephone: '+212611111111',
        prenom: 'Tester2'
      })
      .expect(200);
    expect(res.body.success).toBe(true);
    const user = res.body.data.user;
    expect(user.telephone).toBe('+212611111111');
    expect(user.prenom).toBe('Tester2');
  });

  it('rejects update without auth', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ telephone: '+212622222222' })
      .expect(401);
    expect(res.body.success).toBe(false);
  });
});
