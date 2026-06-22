const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'chattix_files';
    let resource_type = 'auto'; // automatically detects image vs raw vs video

    if (file.mimetype.startsWith('image/')) {
      folder = 'chattix_images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'chattix_videos';
      resource_type = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'chattix_audio';
      resource_type = 'video'; // Cloudinary treats audio as video for resource_type
    }

    return {
      folder: folder,
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
