require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

const standardRims = [
  { id: 'wheel_set_stock', name: 'Stock Wheels', modelUrl: 'rims/tire.glb', isDefault: true },
  { id: 'equip_5', name: 'Work Equip 05', modelUrl: 'rims/equip 5.glb', isDefault: false },
  { id: 'bbs_lm', name: 'BBS LM', modelUrl: 'rims/lm.glb', isDefault: false },
  { id: 'meister_s1', name: 'Work Meister S1', modelUrl: 'rims/meister.glb', isDefault: false },
  { id: 'enkei_nt03', name: 'Enkei NT03+M', modelUrl: 'rims/nt03.glb', isDefault: false },
  { id: 'vs_xx', name: 'Work VS-XX', modelUrl: 'rims/vs-xx.glb', isDefault: false }
];

const carsData = [
  {
    brand: 'Audi',
    model: 'R8 Green Hell Edition',
    year: 2021,
    slug: 'audi-r8',
    description: 'Mid-engine supercar with V10 power and quattro all-wheel drive.',
    model3D: {
      url: 'models/r8.glb',
      materials: [
        { name: 'Body_Paint', isPaintable: true },
        { name: 'Mirror_Paint', isPaintable: true }
      ]
    },
    images: [{ url: 'images/audi.jpg', isPrimary: true }],
    specs: {
      engine: '5.2L V10',
      power: '562 HP',
      torque: '398 lb-ft',
      zeroToSixty: '3.2s'
    },
    tags: ['supercar', 'v10', 'audi', 'quattro'],
    rims: standardRims
  },
  {
    brand: 'Audi',
    model: 'RS6 Avant',
    year: 2020,
    slug: 'audi-rs6',
    description: 'High-performance wagon with twin-turbo V8 powertrain.',
    model3D: {
      url: 'models/2020_audi_rs6_avant.glb',
      materials: [
        { name: 'Car_Body', isPaintable: true },
        { name: 'Body', isPaintable: true }
      ]
    },
    images: [{ url: 'images/rs6.jpg', isPrimary: true }],
    specs: {
      engine: '4.0L Twin-Turbo V8',
      power: '591 HP',
      torque: '590 lb-ft',
      zeroToSixty: '3.6s'
    },
    tags: ['wagon', 'v8', 'audi', 'twin-turbo'],
    rims: standardRims
  },
  {
    brand: 'Lamborghini',
    model: 'Gallardo',
    year: 2008,
    slug: 'lamborghini-gallardo',
    description: 'Iconic V10 supercar featuring custom modular widebody tuning options.',
    model3D: {
      url: 'models/gallardomain.glb',
      materials: [
        { name: 'gallardoVehicle_Exterior_mm_ext1', isPaintable: true },
        { name: 'gallardoVehicle_Exterior_mm_cab1', isPaintable: true }
      ]
    },
    images: [{ url: 'images/lambo.jpg', isPrimary: true }],
    specs: {
      engine: '5.2L V10',
      power: '562 HP',
      torque: '398 lb-ft',
      zeroToSixty: '3.4s'
    },
    tags: ['supercar', 'v10', 'lamborghini', 'italian'],
    rims: standardRims
  },
  {
    brand: 'Lamborghini',
    model: 'Huracán',
    year: 2020,
    slug: 'lamborghini-huracan',
    description: 'Naturally aspirated V10 beast with carbon aerodynamic enhancements.',
    model3D: {
      url: 'models/lamborghini_huracan.glb',
      materials: [
        { name: 'Car_Body', isPaintable: true },
        { name: 'paint', isPaintable: true }
      ]
    },
    images: [{ url: 'images/huracan.jpg', isPrimary: true }],
    specs: {
      engine: '5.2L V10',
      power: '631 HP',
      torque: '443 lb-ft',
      zeroToSixty: '2.9s'
    },
    tags: ['supercar', 'v10', 'lamborghini'],
    rims: standardRims
  },
  {
    brand: 'Lamborghini',
    model: 'Revuelto',
    year: 2023,
    slug: 'lamborghini-revuelto',
    description: 'Next-generation 1001 HP V12 plug-in hybrid electrified supercar.',
    model3D: {
      url: 'models/lamborghini_revuelto.glb',
      materials: [
        { name: 'Car_Body', isPaintable: true },
        { name: 'paint', isPaintable: true }
      ]
    },
    images: [{ url: 'images/reveoulto.jpg', isPrimary: true }],
    specs: {
      engine: '6.5L V12 Hybrid',
      power: '1001 HP',
      torque: '793 lb-ft',
      zeroToSixty: '2.5s'
    },
    tags: ['hypercar', 'v12', 'hybrid', 'lamborghini'],
    rims: standardRims
  },
  {
    brand: 'Ferrari',
    model: 'F40',
    year: 1987,
    slug: 'ferrari-f40',
    description: 'Twin-turbocharged analog supercar legend celebrating 40 years of Ferrari.',
    model3D: {
      url: 'models/1987_ferrari_f40.glb',
      materials: [
        { name: 'Car_Body', isPaintable: true },
        { name: 'paint', isPaintable: true }
      ]
    },
    images: [{ url: 'images/f40.jpg', isPrimary: true }],
    specs: {
      engine: '2.9L Twin-Turbo V8',
      power: '471 HP',
      torque: '426 lb-ft',
      zeroToSixty: '3.8s'
    },
    tags: ['classic', 'supercar', 'v8', 'ferrari', 'twin-turbo'],
    rims: standardRims
  },
  {
    brand: 'Ferrari',
    model: '12Cilindri',
    year: 2025,
    slug: 'ferrari-12cilindri',
    description: 'Front-mid mounted 819 HP naturally aspirated V12 grand tourer.',
    model3D: {
      url: 'models/2025_ferrari_12cilindri.glb',
      materials: [
        { name: 'Car_Body', isPaintable: true },
        { name: 'paint', isPaintable: true }
      ]
    },
    images: [{ url: 'images/12cilindri.jpg', isPrimary: true }],
    specs: {
      engine: '6.5L Naturally Aspirated V12',
      power: '819 HP',
      torque: '500 lb-ft',
      zeroToSixty: '2.9s'
    },
    tags: ['supercar', 'v12', 'ferrari'],
    rims: standardRims
  },
  {
    brand: 'BMW',
    model: 'M4 F82',
    year: 2018,
    slug: 'bmw-m4-f82',
    description: 'High-performance sports coupe powered by the twin-turbo S55 inline-6.',
    model3D: {
      url: 'models/f82.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/bmw.jpg', isPrimary: true }],
    specs: {
      engine: '3.0L Twin-Turbo I6',
      power: '425 HP',
      torque: '406 lb-ft',
      zeroToSixty: '4.1s'
    },
    tags: ['coupe', 'bmw', 'm-power', 'inline-6'],
    rims: standardRims
  },
  {
    brand: 'BMW',
    model: 'M8 Competition',
    year: 2020,
    slug: 'bmw-m8-competition',
    description: 'Luxury grand tourer with twin-turbo V8 performance and M xDrive.',
    model3D: {
      url: 'models/m8.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/bmw.jpg', isPrimary: true }],
    specs: {
      engine: '4.4L Twin-Turbo V8',
      power: '617 HP',
      torque: '553 lb-ft',
      zeroToSixty: '3.0s'
    },
    tags: ['grand-tourer', 'bmw', 'v8', 'competition'],
    rims: standardRims
  },
  {
    brand: 'Toyota',
    model: 'Supra MK4',
    year: 1998,
    slug: 'toyota-supra',
    description: 'JDM tuning icon powered by the legendary twin-turbo 2JZ-GTE engine.',
    model3D: {
      url: 'models/supra.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/supra.png', isPrimary: true }],
    specs: {
      engine: '3.0L Twin-Turbo 2JZ',
      power: '326 HP',
      torque: '325 lb-ft',
      zeroToSixty: '4.6s'
    },
    tags: ['jdm', '2jz', 'toyota', 'supra'],
    rims: standardRims
  },
  {
    brand: 'Toyota',
    model: 'GR Supra MK5',
    year: 2020,
    slug: 'toyota-gr-supra',
    description: 'Modern track-tuned sports coupe with turbocharged B58 engine.',
    model3D: {
      url: 'models/mk5.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/mk5.jpg', isPrimary: true }],
    specs: {
      engine: '3.0L Twin-Turbo B58',
      power: '382 HP',
      torque: '368 lb-ft',
      zeroToSixty: '3.9s'
    },
    tags: ['sports-car', 'toyota', 'gr', 'supra'],
    rims: standardRims
  },
  {
    brand: 'Nissan',
    model: 'Skyline GT-R R34',
    year: 1999,
    slug: 'nissan-gtr-r34',
    description: 'Legendary Skyline GT-R with twin-turbo RB26DETT and ATTESA E-TS AWD.',
    model3D: {
      url: 'models/r34.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/nissan.jpg', isPrimary: true }],
    specs: {
      engine: '2.6L Twin-Turbo RB26',
      power: '276 HP',
      torque: '289 lb-ft',
      zeroToSixty: '4.9s'
    },
    tags: ['jdm', 'skyline', 'gtr', 'rb26', 'nissan'],
    rims: standardRims
  },
  {
    brand: 'Nissan',
    model: 'Skyline GT-R R33',
    year: 1997,
    slug: 'nissan-skyline-r33',
    description: 'V-Spec all-wheel-drive icon built for high-speed stability.',
    model3D: {
      url: 'models/1997_nissan_skyline_gt-r_v-spec_r33.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/r33.jpg', isPrimary: true }],
    specs: {
      engine: '2.6L Twin-Turbo RB26',
      power: '276 HP',
      torque: '271 lb-ft',
      zeroToSixty: '5.0s'
    },
    tags: ['jdm', 'skyline', 'gtr', 'r33', 'nissan'],
    rims: standardRims
  },
  {
    brand: 'Nissan',
    model: 'Skyline GT-R R32',
    year: 1992,
    slug: 'nissan-skyline-r32',
    description: 'The original "Godzilla" that dominated Group A racing undefeated.',
    model3D: {
      url: 'models/nissan_skyline_r32_gt-r.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/r32.jpg', isPrimary: true }],
    specs: {
      engine: '2.6L Twin-Turbo RB26',
      power: '276 HP',
      torque: '260 lb-ft',
      zeroToSixty: '5.4s'
    },
    tags: ['jdm', 'godzilla', 'skyline', 'r32', 'nissan'],
    rims: standardRims
  },
  {
    brand: 'Nissan',
    model: 'Silvia S14',
    year: 1996,
    slug: 'nissan-silvia-s14',
    description: 'Beloved drift machine featuring the turbocharged SR20DET powerplant.',
    model3D: {
      url: 'models/s14.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/nissan.jpg', isPrimary: true }],
    specs: {
      engine: '2.0L Turbo SR20',
      power: '205 HP',
      torque: '203 lb-ft',
      zeroToSixty: '6.5s'
    },
    tags: ['jdm', 'drift', 'silvia', 's14', 'sr20'],
    rims: standardRims
  },
  {
    brand: 'Nissan',
    model: 'Silvia S15',
    year: 2000,
    slug: 'nissan-silvia-s15',
    description: 'Final generation Silvia with refined aerodynamics and 6-speed transmission.',
    model3D: {
      url: 'models/s15main.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/nissan.jpg', isPrimary: true }],
    specs: {
      engine: '2.0L Turbo SR20',
      power: '247 HP',
      torque: '203 lb-ft',
      zeroToSixty: '5.8s'
    },
    tags: ['jdm', 'drift', 'silvia', 's15', 'sr20'],
    rims: standardRims
  },
  {
    brand: 'Porsche',
    model: '911 Carrera (996)',
    year: 2002,
    slug: 'porsche-911',
    description: 'Iconic rear-engine German sports car with water-cooled flat-six power.',
    model3D: {
      url: 'models/996.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/logo.png', isPrimary: true }],
    specs: {
      engine: '3.4L Flat-6',
      power: '296 HP',
      torque: '258 lb-ft',
      zeroToSixty: '4.9s'
    },
    tags: ['german', 'sports-car', 'flat-6', 'porsche', '911'],
    rims: standardRims
  },
  {
    brand: 'Mercedes-Benz',
    model: 'AMG GT',
    year: 2018,
    slug: 'mercedes-amg-gt',
    description: 'Front mid-engine sports car with handcrafted AMG 4.0L twin-turbo V8.',
    model3D: {
      url: 'models/car_modular.glb',
      materials: [{ name: 'Car_Body', isPaintable: true }]
    },
    images: [{ url: 'images/logo.png', isPrimary: true }],
    specs: {
      engine: '4.0L Twin-Turbo V8',
      power: '469 HP',
      torque: '465 lb-ft',
      zeroToSixty: '3.9s'
    },
    tags: ['german', 'amg', 'v8', 'mercedes'],
    rims: standardRims
  }
];

const seedCars = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is required to run seed script.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(uri);
    console.log(`✅ Connected to DB: ${mongoose.connection.name}`);

    let upsertCount = 0;
    for (const car of carsData) {
      await Car.findOneAndUpdate(
        { slug: car.slug },
        { $set: { ...car, isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upsertCount++;
      console.log(`  ✓ Synced car: ${car.brand} ${car.model} (${car.slug})`);
    }

    console.log(`\n🎉 Successfully seeded ${upsertCount} cars into database.`);
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedCars();
}

module.exports = { carsData, seedCars };
