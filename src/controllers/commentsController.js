const pool = require('../config/db');

const getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.id AS user_id, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

const createComment = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (content.length > 2000) return res.status(400).json({ error: 'Comment too long (max 2000 chars)' });

  try {
    const postExists = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!postExists.rows[0]) return res.status(404).json({ error: 'Post not found' });

    const { rows } = await pool.query(
      `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [postId, req.user.id, content.trim()]
    );

    const userRes = await pool.query(
      'SELECT id, username, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );

    res.status(201).json({ ...rows[0], ...userRes.rows[0], user_id: userRes.rows[0].id });
  } catch {
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    const { rows } = await pool.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (!rows[0]) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

module.exports = { getComments, createComment, deleteComment };
