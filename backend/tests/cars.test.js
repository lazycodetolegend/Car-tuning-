require('./setup');
const request = require('supertest');
const app = require('../server');
const Car = require('../models/Car');
const { carsData } = require('../scripts/seedCars');

describe('Cars API Contract (/api/cars) & Health (/api/health)', () => {
  beforeEach(async () => {
    // Seed cars for testing
    for (const car of carsData) {
      await Car.create({ ...car, isActive: true });
    }
  });

  test('GET /api/health → expect 200 with ok status and db connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });

  test('GET /api/cars → expect 200 with seeded cars', async () => {
    const res = await request(app).get('/api/cars');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(carsData.length);
    expect(res.body[0]).toHaveProperty('slug');
    expect(res.body[0]).toHaveProperty('model3D');
  });

  test('GET /api/cars?brand=Nissan → filters cars by brand', async () => {
    const res = await request(app).get('/api/cars?brand=Nissan');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((car) => {
      expect(car.brand.toLowerCase()).toBe('nissan');
    });
  });

  test('GET /api/cars/:idOrSlug → retrieves car and increments popularity', async () => {
    const carBefore = await Car.findOne({ slug: 'lamborghini-gallardo' });
    const initialPop = carBefore.popularity || 0;

    const res = await request(app).get('/api/cars/lamborghini-gallardo');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('lamborghini-gallardo');
    expect(res.body.brand).toBe('Lamborghini');

    // Allow fire-and-forget update to complete
    await new Promise((r) => setTimeout(r, 100));

    const carAfter = await Car.findOne({ slug: 'lamborghini-gallardo' });
    expect(carAfter.popularity).toBe(initialPop + 1);
  });

  test('GET /api/cars/:id/similar → returns up to 6 same-brand cars', async () => {
    const target = await Car.findOne({ slug: 'nissan-gtr-r34' });
    const res = await request(app).get(`/api/cars/${target._id}/similar`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((car) => {
      expect(car.brand).toBe(target.brand);
      expect(car._id.toString()).not.toBe(target._id.toString());
    });
  });
});
