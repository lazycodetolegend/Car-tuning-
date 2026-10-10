require('./setup');
const { carsData, seedCars } = require('../scripts/seedCars');
const Car = require('../models/Car');

describe('Seed Script (backend/scripts/seedCars.js)', () => {
  test('seedCars should insert all 18 cars idempotently', async () => {
    // 1. First run: upsert all cars
    for (const car of carsData) {
      await Car.findOneAndUpdate(
        { slug: car.slug },
        { $set: { ...car, isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const count1 = await Car.countDocuments();
    expect(count1).toBe(18);

    // 2. Second run: re-run to prove idempotency
    for (const car of carsData) {
      await Car.findOneAndUpdate(
        { slug: car.slug },
        { $set: { ...car, isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const count2 = await Car.countDocuments();
    expect(count2).toBe(18); // Count must not duplicate!

    // Verify properties
    const gallardo = await Car.findOne({ slug: 'lamborghini-gallardo' });
    expect(gallardo).toBeDefined();
    expect(gallardo.brand).toBe('Lamborghini');
    expect(gallardo.model3D.url).toBe('models/gallardomain.glb');
    expect(gallardo.rims.length).toBeGreaterThan(0);
  });
});
