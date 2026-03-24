const express = require('express');
const { getComments, createComment, deleteComment } = require('../controllers/commentsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:postId/comments', getComments);
router.post('/:postId/comments', authenticate, createComment);
router.delete('/comments/:commentId', authenticate, deleteComment);

module.exports = router;
