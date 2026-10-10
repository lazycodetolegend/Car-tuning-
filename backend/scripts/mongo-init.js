// MongoDB initialization script for Docker
db = db.getSiblingDB('car-tuning-app');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password', 'firstName', 'lastName'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'admin', 'moderator']
        }
      }
    }
  }
});

db.createCollection('cars', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'brand', 'model', 'year', 'category'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        brand: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        model: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        year: {
          bsonType: 'int',
          minimum: 1900,
          maximum: 2030
        },
        category: {
          bsonType: 'string',
          enum: ['sports', 'luxury', 'supercar', 'tuner', 'classic', 'electric', 'suv', 'sedan', 'coupe', 'convertible']
        }
      }
    }
  }
});

db.createCollection('tunings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'car', 'name'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        user: {
          bsonType: 'objectId'
        },
        car: {
          bsonType: 'objectId'
        },
        isPublic: {
          bsonType: 'bool'
        },
        isTemplate: {
          bsonType: 'bool'
        }
      }
    }
  }
});

db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'name'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        user: {
          bsonType: 'objectId'
        },
        isPublic: {
          bsonType: 'bool'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.cars.createIndex({ name: 1, brand: 1 });
db.cars.createIndex({ category: 1 });
db.cars.createIndex({ brand: 1 });
db.cars.createIndex({ year: -1 });
db.cars.createIndex({ popularity: -1 });
db.cars.createIndex({ isFeatured: 1 });
db.cars.createIndex({ isActive: 1 });
db.cars.createIndex({ tags: 1 });

db.tunings.createIndex({ user: 1, createdAt: -1 });
db.tunings.createIndex({ car: 1 });
db.tunings.createIndex({ isPublic: 1, isActive: 1 });
db.tunings.createIndex({ isTemplate: 1 });
db.tunings.createIndex({ tags: 1 });
db.tunings.createIndex({ 'likes.user': 1 });
db.tunings.createIndex({ views: -1 });
db.tunings.createIndex({ createdAt: -1 });

db.projects.createIndex({ user: 1, createdAt: -1 });
db.projects.createIndex({ isPublic: 1, isActive: 1 });
db.projects.createIndex({ tags: 1 });
db.projects.createIndex({ views: -1 });

print('Database initialization completed successfully!');
