const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/messageController');
const requireAuth = require('../middleware/authMiddleware');

// Protect all routes in this file
router.use(requireAuth);

router.post('/', sendMessage);
router.get('/:recipientId', getMessages);

module.exports = router;
