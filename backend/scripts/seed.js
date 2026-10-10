const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Car = require('../models/Car');
const Tuning = require('../models/Tuning');

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@cartuning.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isEmailVerified: true
  },
  {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    isEmailVerified: true
  },
  {
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    isEmailVerified: true
  }
];

const sampleCars = [
  {
    name: 'Audi R8 V10',
    brand: 'Audi',
    model: 'R8',
    year: 2023,
    category: 'supercar',
    description: 'The Audi R8 V10 is a mid-engine sports car that combines performance with luxury.',
    specifications: {
      engine: '5.2L V10',
      horsepower: 562,
      torque: 406,
      acceleration: 3.2,
      topSpeed: 201,
      weight: 1655,
      fuelType: 'gasoline',
      transmission: 'automatic',
      drivetrain: 'awd'
    },
    images: [
      {
        url: 'https://example.com/audi-r8-1.jpg',
        alt: 'Audi R8 front view',
        isPrimary: true
      }
    ],
    model3D: {
      url: '/models/r8.glb',
      format: 'glb',
      materials: [
        { name: 'Body_Paint', type: 'body', isPaintable: true },
        { name: 'Mirror_Paint', type: 'body', isPaintable: true }
      ]
    },
    rims: [
      {
        name: 'Audi Sport Wheels',
        brand: 'Audi',
        model3D: {
          url: '/rims/audi-sport.glb',
          format: 'glb'
        },
        specifications: {
          diameter: 20,
          width: 9,
          offset: 35,
          material: 'aluminum'
        },
        isDefault: true
      }
    ],
    tuningParts: [
      {
        category: 'engine',
        name: 'Stage 1 ECU Tune',
        brand: 'APR',
        description: 'Increases horsepower and torque while maintaining reliability.',
        price: 899,
        performanceGain: {
          horsepower: 50,
          torque: 40,
          weight: 0
        },
        isAvailable: true
      }
    ],
    price: {
      base: 169900,
      currency: 'USD'
    },
    tags: ['supercar', 'luxury', 'performance', 'v10'],
    isFeatured: true,
    popularity: 150
  },
  {
    name: 'Lamborghini Gallardo LP560-4',
    brand: 'Lamborghini',
    model: 'Gallardo',
    year: 2012,
    category: 'supercar',
    description: 'The Lamborghini Gallardo is a sports car that defined the entry-level supercar segment.',
    specifications: {
      engine: '5.2L V10',
      horsepower: 552,
      torque: 398,
      acceleration: 3.7,
      topSpeed: 201,
      weight: 1410,
      fuelType: 'gasoline',
      transmission: 'automatic',
      drivetrain: 'awd'
    },
    images: [
      {
        url: 'https://example.com/lambo-gallardo-1.jpg',
        alt: 'Lamborghini Gallardo side view',
        isPrimary: true
      }
    ],
    model3D: {
      url: '/models/gallardo.glb',
      format: 'glb',
      materials: [
        { name: 'gallardoVehicle_Exterior_mm_ext1', type: 'body', isPaintable: true },
        { name: 'gallardoVehicle_Exterior_mm_cab1', type: 'body', isPaintable: true }
      ]
    },
    rims: [
      {
        name: 'Lamborghini Wheels',
        brand: 'Lamborghini',
        model3D: {
          url: '/rims/lambo-wheels.glb',
          format: 'glb'
        },
        specifications: {
          diameter: 19,
          width: 8.5,
          offset: 30,
          material: 'aluminum'
        },
        isDefault: true
      }
    ],
    tuningParts: [
      {
        category: 'exhaust',
        name: 'Titanium Exhaust System',
        brand: 'Akrapovic',
        description: 'Lightweight titanium exhaust system with improved sound and performance.',
        price: 12999,
        performanceGain: {
          horsepower: 15,
          torque: 10,
          weight: -8
        },
        isAvailable: true
      }
    ],
    price: {
      base: 198000,
      currency: 'USD'
    },
    tags: ['supercar', 'italian', 'v10', 'exotic'],
    isFeatured: true,
    popularity: 200
  }
];

const sampleTunings = [
  {
    name: 'Audi R8 Performance Build',
    description: 'A complete performance build for the Audi R8 with engine tuning, exhaust, and suspension upgrades.',
    isPublic: true,
    customizations: {
      paint: [
        {
          materialName: 'Body_Paint',
          color: {
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 }
          },
          finish: 'metallic',
          metallic: 0.9,
          roughness: 0.2
        }
      ],
      performance: {
        engine: {
          turbo: {
            installed: false,
            type: 'single',
            boost: 0,
            horsepowerGain: 0
          },
          ecu: {
            tuned: true,
            tuneType: 'stage2',
            horsepowerGain: 75,
            torqueGain: 60
          },
          intake: {
            upgraded: true,
            type: 'cold_air',
            horsepowerGain: 15
          },
          exhaust: {
            upgraded: true,
            type: 'full_system',
            horsepowerGain: 25,
            soundLevel: 'loud'
          }
        },
        suspension: {
          lowered: true,
          dropHeight: 30,
          type: 'coilovers',
          stiffness: 'adjustable'
        },
        brakes: {
          upgraded: true,
          type: 'big_brake_kit',
          size: 380
        }
      },
      exterior: {
        bodyKit: {
          installed: true,
          name: 'Carbon Fiber Body Kit',
          brand: 'Vorsteiner'
        },
        spoiler: {
          installed: true,
          type: 'ducktail',
          material: 'carbon_fiber'
        },
        lights: {
          headlights: {
            upgraded: true,
            type: 'led'
          },
          taillights: {
            upgraded: true,
            type: 'sequential'
          }
        }
      }
    },
    performanceStats: {
      originalHorsepower: 562,
      tunedHorsepower: 677,
      originalTorque: 406,
      tunedTorque: 526,
      originalWeight: 1655,
      tunedWeight: 1630,
      originalAcceleration: 3.2,
      tunedAcceleration: 2.8,
      originalTopSpeed: 201,
      tunedTopSpeed: 215
    },
    images: [
      {
        url: 'https://example.com/tuning-1.jpg',
        alt: 'Tuned Audi R8 front view',
        isPrimary: true,
        angle: 'front'
      }
    ],
    tags: ['performance', 'stage2', 'carbon', 'track'],
    views: 1250,
    likes: [
      { user: null, likedAt: new Date() }
    ]
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords and create users
    for (let userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const users = await User.insertMany(sampleUsers);
    console.log(`Seeded ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

// Seed cars
const seedCars = async (users) => {
  try {
    // Clear existing cars
    await Car.deleteMany({});
    console.log('Cleared existing cars');

    // Add createdBy field to cars
    const adminUser = users.find(user => user.role === 'admin');
    const carsWithUser = sampleCars.map(car => ({
      ...car,
      createdBy: adminUser._id
    }));

    const cars = await Car.insertMany(carsWithUser);
    console.log(`Seeded ${cars.length} cars`);
    return cars;
  } catch (error) {
    console.error('Error seeding cars:', error);
    throw error;
  }
};

// Seed tunings
const seedTunings = async (users, cars) => {
  try {
    // Clear existing tunings
    await Tuning.deleteMany({});
    console.log('Cleared existing tunings');

    // Create tunings with user and car references
    const regularUser = users.find(user => user.role === 'user');
    const tuningWithRefs = sampleTunings.map(tuning => ({
      ...tuning,
      user: regularUser._id,
      car: cars[0]._id // Use first car
    }));

    const tunings = await Tuning.insertMany(tuningWithRefs);
    console.log(`Seeded ${tunings.length} tunings`);
    return tunings;
  } catch (error) {
    console.error('Error seeding tunings:', error);
    throw error;
  }
};

// Main seed function
const seed = async () => {
  try {
    await connectDB();
    
    const users = await seedUsers();
    const cars = await seedCars(users);
    const tunings = await seedTunings(users, cars);
    
    console.log('Database seeded successfully!');
    console.log(`- ${users.length} users`);
    console.log(`- ${cars.length} cars`);
    console.log(`- ${tunings.length} tunings`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed, seedUsers, seedCars, seedTunings };
