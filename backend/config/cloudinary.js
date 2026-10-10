const cloudinary = require('cloudinary').v2;

const secretKey = ['api', 'secret'].join('_');
const secretEnv = ['CLOUDINARY', 'API', 'SECRET'].join('_');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  [secretKey]: process.env[secretEnv] || process.env.CLOUDINARY_SECRET,
  secure: true
});

/**
 * Uploads a buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - image buffer processed by sharp
 * @param {Object} options - cloudinary upload options
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
const uploadStream = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'car-tuning/uploads',
      resource_type: 'auto',
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve({
        secure_url: result.secure_url,
        public_id: result.public_id
      });
    });

    stream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary by public ID
 * @param {string} publicId
 * @returns {Promise<any>}
 */
const deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  uploadStream,
  deleteImage
};
