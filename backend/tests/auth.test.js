require('./setup');
const request = require('supertest');
const app = require('../server');

describe('Auth API Contract & Security (/api/auth)', () => {
  const testUser = {
    email: 'tuner@example.com',
    password: 'password123',
    username: 'tuner_pro',
    firstName: 'Speed',
    lastName: 'Racer'
  };

  test('POST /api/auth/register with a new email → expect 201 + token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('__v');
  });

  test('POST /api/auth/register again with the same email → expect 409', async () => {
    // Register first time
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Register second time with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        username: 'different_user'
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/auth/login with a wrong password → expect 401 with generic message', async () => {
    // Register first
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Try login with incorrect password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrong_password_999'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('POST /api/auth/login with unknown email → expect 401 with same generic message (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown_ghost_user@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('POST /api/auth/login correct → expect 200 + token', async () => {
    // Register first
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Login with correct credentials
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  test('GET /api/auth/me with that token → 200; without a token → 401', async () => {
    // 1. Without token -> 401
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);

    // 2. Register to get valid token
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    const token = regRes.body.token;

    // 3. With token -> 200
    const authRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.email).toBe(testUser.email);
    expect(authRes.body.username).toBe(testUser.username);
  });

  test('PATCH /api/auth/me updates allowed fields and blocks role changes', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    const token = regRes.body.token;

    const patchRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        role: 'admin', // Should be ignored
        email: 'hacked@example.com' // Should be ignored
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.firstName).toBe('UpdatedFirst');
    expect(patchRes.body.lastName).toBe('UpdatedLast');
    expect(patchRes.body.role).toBe('user'); // Unchanged
    expect(patchRes.body.email).toBe(testUser.email); // Unchanged
  });
});
