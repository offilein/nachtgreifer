require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/ratings');
const userRoutes = require('./routes/users');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/api/posts', ratingRoutes);
app.use('/api/users', userRoutes);

// Unknown API routes → JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nachtgreifer running on port ${PORT}`);
});
