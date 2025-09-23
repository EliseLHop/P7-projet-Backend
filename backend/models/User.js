// models/User.js
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const validator = require('validator');

const hasValidTLD = (email) => /\.[A-Za-z]{2,}$/.test(email); // TLD min 2 caractères

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value) =>
        validator.isEmail(value, {
          allow_utf8_local_part: false,
          require_tld: true,
          minDomainSegments: 2
        }) && hasValidTLD(value),
      message: 'Email invalide'
    }
  },
  password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
