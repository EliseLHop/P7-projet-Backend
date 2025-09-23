// app.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const booksRoutes = require('./routes/Books');
const userRoutes = require('./routes/User');

const app = express();

// Vérifs env
const { MONGODB_URI, JWT_SECRET, CORS_ORIGINS } = process.env;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI manquant. Ajoute-le dans .env');
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET manquant. Ajoute-le dans .env');
  process.exit(1);
}

// Connexion MongoDB
mongoose.set('strictQuery', true);
mongoose
  .connect(MONGODB_URI, {})
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((err) => {
    console.error('Connexion à MongoDB échouée :', err.message);
    process.exit(1);
  });

// CORS whitelist
const allowed = (CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman / curl
    return cb(null, allowed.includes(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content', 'Accept', 'Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

app.use((req, res, next) => {
  if (req.headers.origin) console.log('Origin:', req.headers.origin);
  next();
});

app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Statique
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.use('/api/books', booksRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;
