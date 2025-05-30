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
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');

// Middleware berhubungan dengan enkripsi dll.
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

// memungkinkan untuk mengakses file-file di folder public langsung melalui browser, tanpa perlu membuat route satu per satu.
app.use(express.static('public'));
app.use('/api/admin', adminRoutes);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/aktivitas', aktivitasRoutes);
app.use('/api/reward', rewardRoutes);
app.use('/api/edukasi', edukasiRoutes);

app.get(['/', '/login'], (req, res) => {
  res.render('pages/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.get('/dashboard', (req, res) => {
  res.render('pages/dashboard');
});

app.get('/user', (req, res) => {
  res.render('pages/user');
});

app.get('/aktivitas', (req, res) => {
  res.render('pages/aktivitas');
});

app.get('/edukasi', (req, res) => {
  res.render('pages/edukasi');
});

app.get('/reward', (req, res) => {
  res.render('pages/reward');
});

app.get('/tambah-edukasi', (req, res) => {
  res.render('pages/tambah-edukasi');
});

app.get('/tambah-reward', (req, res) => {
  res.render('pages/tambah-reward');
});

app.get('/tambah-user', (req, res) => {
  res.render('pages/tambah-user');
});

app.get('/edit-edukasi/:id', (req, res) => {
  res.render('pages/edit-edukasi', {
    title: 'Edit Edukasi',
    style: 'edit-edukasi',
    script: 'edit-edukasi',
    withSidebar: true,
    withTopbar: true,
    id: req.params.id, // untuk digunakan di EJS atau JS
  });
});

app.get('/edit-reward/:id', (req, res) => {
  res.render('pages/edit-reward', {
    title: 'Edit Reward',
    style: 'edit-reward',
    script: 'edit-reward',
    withSidebar: true,
    withTopbar: false,
    id: req.params.id, // untuk digunakan di EJS atau JS
  });
});

app.get('/edit-user/:id', (req, res) => {
  res.render('pages/edit-user', {
    title: 'Edit Pengguna',
    style: 'user',
    script: 'edit-user',
    withSidebar: true,
    withTopbar: true,
    id: req.params.id,
  });
});

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/public/login.html');
// });

// DB Connection
sequelize
  .sync()
  .then(() => console.log('MySQL DB synced'))
  .catch((err) => console.error('DB error:', err));

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
