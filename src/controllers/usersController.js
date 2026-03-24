const pool = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT id, username, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    const posts = await pool.query(
      `SELECT p.id, p.title, p.image_url, p.created_at,
              COALESCE(SUM(r.value), 0)::int AS score,
              COUNT(DISTINCT c.id)::int AS comment_count
       FROM posts p
       LEFT JOIN ratings r ON r.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.json({ ...rows[0], posts: posts.rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required' });

  try {
    const current = await pool.query('SELECT avatar_public_id FROM users WHERE id = $1', [req.user.id]);
    if (current.rows[0]?.avatar_public_id) {
      await deleteFromCloudinary(current.rows[0].avatar_public_id);
    }

    const result = await uploadToCloudinary(req.file.buffer, 'nachtgreifer/avatars', {
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }],
    });

    const { rows } = await pool.query(
      'UPDATE users SET avatar_url = $1, avatar_public_id = $2 WHERE id = $3 RETURNING id, username, avatar_url',
      [result.secure_url, result.public_id, req.user.id]
    );

    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update avatar' });
  }
};

module.exports = { getUser, updateAvatar };
