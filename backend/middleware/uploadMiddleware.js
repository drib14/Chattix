import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

// Allow all file types as requested by user
const fileFilter = (req, file, cb) => {
  // Always accept to allow any file
  cb(null, true);
};

// Profile photo upload - 20MB limit
export const uploadProfile = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for profile photos
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|gif|webp/;
    const allowedMime = /jpeg|jpg|png|gif|webp/;
    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMime.test(file.mimetype);

    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile photos.'));
    }
  },
});

// Image upload - 20MB limit
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for images
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|gif|webp/;
    const allowedMime = /jpeg|jpg|png|gif|webp/;
    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMime.test(file.mimetype);

    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// Document upload - 50MB limit (PDF, DOC, etc.)
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for documents
  },
  fileFilter: (req, file, cb) => {
    const allowedMime = /pdf|msword|wordprocessingml|mspowerpoint|officedocument|excel|spreadsheetml|zip|rar|plain/;
    const mimetype = allowedMime.test(file.mimetype);

    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only document files are allowed (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, RAR, TXT).'));
    }
  },
});

// Audio upload - 50MB limit
export const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for audio
  },
  fileFilter: (req, file, cb) => {
    const allowedMime = /audio|mp3|wav|ogg|m4a|webm/;
    const mimetype = allowedMime.test(file.mimetype);

    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed.'));
    }
  },
});

// General message attachment upload - handles all types with appropriate limits
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for any file
  },
  fileFilter,
});