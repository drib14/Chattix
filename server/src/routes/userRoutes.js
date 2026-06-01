import express from 'express';
import {
  searchUsers,
  updateProfile,
  getContacts,
  sendContactRequest,
  acceptContactRequest,
  rejectContactRequest,
  toggleFavorite,
  removeContact,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All user and contact routes are protected

router.get('/search', searchUsers);
router.put('/profile', updateProfile);
router.get('/contacts', getContacts);
router.post('/contacts/request', sendContactRequest);
router.post('/contacts/accept', acceptContactRequest);
router.post('/contacts/reject', rejectContactRequest);
router.post('/contacts/favorite', toggleFavorite);
router.delete('/contacts/:id', removeContact);

export default router;
