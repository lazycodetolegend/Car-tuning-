require('./setup');
const request = require('supertest');
const app = require('../server');
const Car = require('../models/Car');

describe('Builds API & Strict Ownership Security (/api/builds)', () => {
  let userA, tokenA;
  let userB, tokenB;
  let seededCar;

  beforeEach(async () => {
    // 1. Seed a car
    seededCar = await Car.create({
      brand: 'Lamborghini',
      model: 'Gallardo',
      year: 2008,
      slug: 'lamborghini-gallardo',
      model3D: {
        url: 'models/gallardomain.glb',
        materials: [{ name: 'Body_Paint', isPaintable: true }]
      },
      isActive: true
    });

    // 2. Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'userA@example.com',
        password: 'password123',
        username: 'userA_tuning'
      });
    userA = resA.body.user;
    tokenA = resA.body.token;

    // 3. Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'userB@example.com',
        password: 'password123',
        username: 'userB_tuning'
      });
    userB = resB.body.user;
    tokenB = resB.body.token;
  });

  test('POST /api/builds with token → 201 created with populated car', async () => {
    const res = await request(app)
      .post('/api/builds')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        car: seededCar._id,
        name: "User A's Custom Gallardo",
        paintColors: [{ materialName: 'Body_Paint', hex: '#ff0000' }],
        selectedRim: 'equip_5',
        extras: { turbo: 'Stage 2', ecu: 'Track Tune' }
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe("User A's Custom Gallardo");
    expect(res.body.user.toString()).toBe(userA._id.toString());
    expect(res.body.car).toHaveProperty('model', 'Gallardo');
  });

  test('GET /api/builds/mine with a token → 200 and contains the user builds', async () => {
    // Create build for User A
    await request(app)
      .post('/api/builds')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        car: seededCar._id,
        name: 'User A Build 1'
      });

    const res = await request(app)
      .get('/api/builds/mine')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('User A Build 1');

    // User B mine should be empty
    const resB = await request(app)
      .get('/api/builds/mine')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resB.status).toBe(200);
    expect(resB.body.length).toBe(0);
  });

  test("GET /api/builds/<someone else's id> with a different user's token → expect 404", async () => {
    // User A creates a build
    const createRes = await request(app)
      .post('/api/builds')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        car: seededCar._id,
        name: 'Secret Build A',
        paintColors: [{ materialName: 'Body_Paint', hex: '#00ff00' }]
      });

    const buildIdA = createRes.body._id;

    // User A can access it
    const accessA = await request(app)
      .get(`/api/builds/${buildIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(accessA.status).toBe(200);

    // User B attempts to access User A's build → MUST return 404 (not 403, preventing existence leaks)
    const accessB = await request(app)
      .get(`/api/builds/${buildIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(accessB.status).toBe(404);
    expect(accessB.body.error).toBe('Build not found');
  });

  test("PATCH /api/builds/<someone else's id> with a different user's token → expect 404", async () => {
    const createRes = await request(app)
      .post('/api/builds')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        car: seededCar._id,
        name: 'Original Build Name'
      });

    const buildIdA = createRes.body._id;

    // User B attempts to update User A's build
    const patchRes = await request(app)
      .patch(`/api/builds/${buildIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Hacked by User B'
      });

    expect(patchRes.status).toBe(404);

    // Verify build was NOT modified
    const checkRes = await request(app)
      .get(`/api/builds/${buildIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(checkRes.body.name).toBe('Original Build Name');
  });

  test("DELETE /api/builds/<someone else's id> with a different user's token → expect 404", async () => {
    const createRes = await request(app)
      .post('/api/builds')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        car: seededCar._id,
        name: 'Protected Build'
      });

    const buildIdA = createRes.body._id;

    // User B attempts to delete User A's build
    const deleteRes = await request(app)
      .delete(`/api/builds/${buildIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteRes.status).toBe(404);

    // User A deletes their own build → 200
    const ownerDeleteRes = await request(app)
      .delete(`/api/builds/${buildIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(ownerDeleteRes.status).toBe(200);
    expect(ownerDeleteRes.body.message).toBe('Build deleted successfully');
  });

  test('GET /api/builds/public/:shareSlug behaves correctly based on isPublic flag', async () => {
    // 1. Private build
    const privateBuild = await request(app)
      .post('/api/builds')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        car: seededCar._id,
        name: 'Private Garage Build',
        isPublic: false
      });

    const privateSlug = privateBuild.body.shareSlug;

    const privateCheck = await request(app).get(`/api/builds/public/${privateSlug}`);
    expect(privateCheck.status).toBe(404);

    // 2. Public build
    const publicBuild = await request(app)
      .post('/api/builds')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        car: seededCar._id,
        name: 'Showcase Public Build',
        isPublic: true
      });

    const publicSlug = publicBuild.body.shareSlug;

    const publicCheck = await request(app).get(`/api/builds/public/${publicSlug}`);
    expect(publicCheck.status).toBe(200);
    expect(publicCheck.body.name).toBe('Showcase Public Build');
    expect(publicCheck.body.user).toHaveProperty('username', 'userA_tuning');
  });
});
