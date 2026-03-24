const express = require('express');
const { getUser, updateAvatar } = require('../controllers/usersController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/:id', getUser);
router.put('/me/avatar', authenticate, upload.single('avatar'), updateAvatar);

module.exports = router;
