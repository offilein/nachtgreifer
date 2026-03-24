const express = require('express');
const { ratePost, removeRating } = require('../controllers/ratingsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/:postId/rate', authenticate, ratePost);
router.delete('/:postId/rate', authenticate, removeRating);

module.exports = router;
