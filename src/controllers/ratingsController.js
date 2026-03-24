const pool = require('../config/db');

const ratePost = async (req, res) => {
  const { postId } = req.params;
  const { value } = req.body;

  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Value must be 1 or -1' });
  }

  try {
    const postExists = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!postExists.rows[0]) return res.status(404).json({ error: 'Post not found' });

    await pool.query(
      `INSERT INTO ratings (post_id, user_id, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET value = EXCLUDED.value`,
      [postId, req.user.id, value]
    );

    const { rows } = await pool.query(
      'SELECT COALESCE(SUM(value), 0)::int AS score FROM ratings WHERE post_id = $1',
      [postId]
    );

    res.json({ score: rows[0].score, user_rating: value });
  } catch {
    res.status(500).json({ error: 'Failed to rate post' });
  }
};

const removeRating = async (req, res) => {
  const { postId } = req.params;
  try {
    await pool.query('DELETE FROM ratings WHERE post_id = $1 AND user_id = $2', [postId, req.user.id]);

    const { rows } = await pool.query(
      'SELECT COALESCE(SUM(value), 0)::int AS score FROM ratings WHERE post_id = $1',
      [postId]
    );

    res.json({ score: rows[0].score, user_rating: null });
  } catch {
    res.status(500).json({ error: 'Failed to remove rating' });
  }
};

module.exports = { ratePost, removeRating };
