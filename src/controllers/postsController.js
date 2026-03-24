const pool = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const SORT_OPTIONS = {
  newest: 'p.created_at DESC',
  oldest: 'p.created_at ASC',
  top: 'score DESC, p.created_at DESC',
  discussed: 'comment_count DESC, p.created_at DESC',
};

const getPosts = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const sort = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;
  const search = req.query.q?.trim() || null;

  const params = [limit, offset];
  const whereClause = search ? `WHERE p.title ILIKE $3` : '';
  if (search) params.push(`%${search}%`);

  try {
    const { rows } = await pool.query(
      `SELECT
        p.id, p.title, p.description, p.image_url, p.created_at,
        u.id AS user_id, u.username, u.avatar_url,
        COUNT(DISTINCT c.id)::int AS comment_count,
        COALESCE(SUM(r.value), 0)::int AS score,
        COUNT(DISTINCT r.id)::int AS rating_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN ratings r ON r.post_id = p.id
       ${whereClause}
       GROUP BY p.id, u.id
       ORDER BY ${sort}
       LIMIT $1 OFFSET $2`,
      params
    );

    const countRes = await pool.query(
      search ? 'SELECT COUNT(*) FROM posts WHERE title ILIKE $1' : 'SELECT COUNT(*) FROM posts',
      search ? [`%${search}%`] : []
    );

    res.json({
      posts: rows,
      pagination: {
        page,
        limit,
        total: parseInt(countRes.rows[0].count),
        pages: Math.ceil(countRes.rows[0].count / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

const getPost = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
        p.id, p.title, p.description, p.image_url, p.created_at,
        u.id AS user_id, u.username, u.avatar_url,
        COALESCE(SUM(r.value), 0)::int AS score,
        COUNT(DISTINCT r.id)::int AS rating_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN ratings r ON r.post_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, u.id`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });

    // Include current user's rating if authenticated
    let userRating = null;
    if (req.user) {
      const ratingRes = await pool.query(
        'SELECT value FROM ratings WHERE post_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      userRating = ratingRes.rows[0]?.value ?? null;
    }

    res.json({ ...rows[0], user_rating: userRating });
  } catch {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

const createPost = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required' });

  const { title, description } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  try {
    const result = await uploadToCloudinary(req.file.buffer, 'nachtgreifer/posts', {
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    const { rows } = await pool.query(
      `INSERT INTO posts (user_id, title, description, image_url, image_public_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, title.trim(), description?.trim() || null, result.secure_url, result.public_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT user_id, image_public_id FROM posts WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await deleteFromCloudinary(rows[0].image_public_id);
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

module.exports = { getPosts, getPost, createPost, deletePost };
