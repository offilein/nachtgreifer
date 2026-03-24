const express = require('express');
const { getPosts, getPost, createPost, deletePost } = require('../controllers/postsController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', authenticate, uploadLimiter, upload.single('image'), createPost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;
