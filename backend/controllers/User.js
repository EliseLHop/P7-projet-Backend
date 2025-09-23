// controllers/User.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Helpers
const normalizeEmail = (e) => (e || '').trim().toLowerCase();
const normalizePassword = (p) => (p || '').trim();
const hasValidTLD = (email) => /\.[A-Za-z]{2,}$/.test(email); // TLD min 2 caractères

// Inscription
exports.signUp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = normalizePassword(req.body.password);

    // Vérif email
    const emailOk =
      validator.isEmail(email, {
        allow_utf8_local_part: false,
        require_tld: true,
        minDomainSegments: 2
      }) && hasValidTLD(email);

    if (!emailOk) {
      return res.status(400).json({ message: "Email invalide. Exemple attendu : user@mail.fr" });
    }

    // Vérif mot de passe (au moins 8 caractères)
    if (password.length < 8) {
      return res.status(400).json({
        message: "Mot de passe trop court (minimum 8 caractères)."
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash });
    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (error) {
    res.status(400).json({ message: "Création utilisateur impossible", error: error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = normalizePassword(req.body.password);

    // Vérif email
    const emailOk =
      validator.isEmail(email, {
        allow_utf8_local_part: false,
        require_tld: true,
        minDomainSegments: 2
      }) && hasValidTLD(email);

    if (!emailOk) {
      return res.status(400).json({ message: "Email invalide. Exemple attendu : user@mail.fr" });
    }

    // Vérif mot de passe non vide
    if (password.length === 0) {
      return res.status(400).json({ message: "Mot de passe requis" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé !" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect !" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({ userId: user._id, token });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
