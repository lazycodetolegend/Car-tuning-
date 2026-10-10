require('./setup');
const request = require('supertest');
const sharp = require('sharp');
const app = require('../server');
const cloudinaryConfig = require('../config/cloudinary');

describe('Uploads API (/api/uploads)', () => {
  let token;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'uploader@example.com',
        password: 'password123',
        username: 'uploader_user'
      });
    token = regRes.body.token;
  });

  test('POST /api/uploads/image without token → 401', async () => {
    const res = await request(app).post('/api/uploads/image');
    expect(res.status).toBe(401);
  });

  test('POST /api/uploads/image with real JPEG buffer → processes with sharp and uploads to Cloudinary', async () => {
    // Generate a valid 200x200 test JPEG buffer with sharp
    const testImageBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .jpeg()
      .toBuffer();

    // Mock uploadStream to return realistic Cloudinary response
    const originalUploadStream = cloudinaryConfig.uploadStream;
    cloudinaryConfig.uploadStream = jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123456789/car-tuning/uploads/sample_car.webp',
      public_id: 'car-tuning/uploads/sample_car'
    });

    const res = await request(app)
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', testImageBuffer, 'test_car.jpg');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('secure_url');
    expect(res.body).toHaveProperty('public_id');
    expect(cloudinaryConfig.uploadStream).toHaveBeenCalled();

    // Restore original
    cloudinaryConfig.uploadStream = originalUploadStream;
  });

  test('POST /api/uploads/image rejects non-image mime types', async () => {
    const textBuffer = Buffer.from('hello this is a text file not an image');

    const res = await request(app)
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', textBuffer, 'document.txt');

    expect(res.status).toBe(400);
  });
});
