const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const aktivitasRoutes = require('./routes/aktivitas');
const rewardRoutes = require('./routes/reward');
const edukasiRoutes = require('./routes/edukasi');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/aktivitas', aktivitasRoutes);
app.use('/api/reward', rewardRoutes);
app.use('/api/edukasi', edukasiRoutes);

// DB Connection
sequelize.sync()
  .then(() => console.log('MySQL DB synced'))
  .catch((err) => console.error('DB error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));