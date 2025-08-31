
// app.js
const express = require ('express')
const mongoose = require('mongoose');

const booksRoutes = require('./routes/Books')
const userRoutes = require('./routes/User')
const path = require('path');


const app = express()
mongoose.connect('mongodb+srv://liliselhop1403:WIBoIWS7kjot9d5y@clusterone.bkyj1mq.mongodb.net/?retryWrites=true&w=majority&appName=ClusterOne',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/books', booksRoutes);
app.use('/api/auth', userRoutes);

module.exports = app