//routes/User.js
const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/User');

router.post('/signup', userCtrl.signUp);
router.post('/login', userCtrl.login);

module.exports = router;
