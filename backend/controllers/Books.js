// controllers/Books.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Book = require('../models/Book');

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre non trouvé' });
    res.status(200).json(book);
  } catch (error) {
    res.status(404).json({ error });
  }
};

exports.addBook = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image manquante' });
    if (!req.body.book) return res.status(400).json({ message: 'Données du livre manquantes' });

    const ref = `resized-${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const compressedImageFilePath = path.join(__dirname, '../', 'images', ref);

    await sharp(req.file.buffer)
      .resize({ width: 900 })
      .jpeg({ quality: 80 })
      .toFile(compressedImageFilePath);

    const bookObject = JSON.parse(req.body.book);

    // Empêcher l'override d'ids et userId depuis le client
    delete bookObject._id;
    delete bookObject.userId;

    // 🔎 Récupère la note initiale quel que soit le format envoyé par le front
    const candidates = [
      req.body?.rating,                                                       // FormData: rating=4
      req.body?.grade,                                                        // FormData: grade=4
      bookObject?.rating,                                                     // { ..., rating: 4 }
      Array.isArray(bookObject?.ratings) ? bookObject.ratings[0]?.grade : undefined // { ratings:[{grade:4}] }
    ];
    const raw = candidates.find(v => v !== undefined && v !== null && v !== '');
    const initialGrade = Number(raw);
    const isValidGrade = Number.isFinite(initialGrade) && initialGrade >= 0 && initialGrade <= 5;

    // On ne persiste pas les champs rating/ratings bruts du client
    delete bookObject.rating;
    delete bookObject.ratings;

    const bookToAdd = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${ref}`,
      ratings: isValidGrade ? [{ userId: req.auth.userId, grade: initialGrade }] : [],
      averageRating: isValidGrade ? initialGrade : 0
    });

    await bookToAdd.save();
    res.status(201).json({ message: 'Objet enregistré', book: bookToAdd });
  } catch (error) {
    res.status(400).json({ error: error.message || error });
  }
};

exports.modifyBook2 = async (req, res, next) => {
  try {
    let bookObject;

    if (req.file) {
      // On a une nouvelle image : resize + sauvegarde
      const ref = `resized-${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      const compressedImageFilePath = path.join(__dirname, '../', 'images', ref);

      await sharp(req.file.buffer)
        .resize({ width: 900 })
        .jpeg({ quality: 80 })
        .toFile(compressedImageFilePath);

      bookObject = {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${ref}`
      };
    } else {
      bookObject = { ...req.body };
    }

    // Ne pas autoriser à changer le userId / _id
    delete bookObject._userId;
    delete bookObject.userId;
    delete bookObject._id;

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre non trouvé' });
    if (book.userId != req.auth.userId) return res.status(401).json({ message: 'Non autorisé' });

    if (req.file) {
      // supprimer l'ancienne image (si existante)
      try {
        const filename = book.imageUrl ? book.imageUrl.split('/images/')[1] : null;
        if (filename) {
          const oldPath = path.join(__dirname, '../', 'images', filename);
          fs.unlink(oldPath, err => {
            if (err) console.error('Erreur suppression ancienne image :', err.message);
          });
        }
      } catch (err) {
        console.error('Erreur lors du retrait de l’ancienne image :', err.message);
      }
    }

    await Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id });
    res.status(200).json({ message: 'Objet modifié' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.addRating = async (req, res, next) => {
  try {
    const ratingValue = Number(req.body.rating);
    if (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      return res.status(400).json({ message: 'Note invalide' });
    }

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre non trouvé' });

    // Vérifier si l'utilisateur a déjà noté
    const userRating = book.ratings.find(r => r.userId === req.auth.userId);
    if (userRating) {
      return res.status(403).json({ message: 'Désolé, vous ne pouvez pas noter plusieurs fois.' });
    }

    const newRating = { userId: req.auth.userId, grade: ratingValue };

    book.ratings.push(newRating);
    book.averageRating = book.ratings.reduce((sum, r) => sum + r.grade, 0) / book.ratings.length;

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre non trouvé' });
    if (book.userId != req.auth.userId) return res.status(401).json({ message: 'Non autorisé' });

    // suppression de l'image
    try {
      const filename = book.imageUrl ? book.imageUrl.split('/images/')[1] : null;
      if (filename) {
        const imagePath = path.join(__dirname, '../', 'images', filename);
        fs.unlink(imagePath, err => {
          if (err) console.error('Erreur suppression image :', err.message);
        });
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de l’image :', err.message);
    }

    await Book.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Objet supprimé' });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.bestRating = async (req, res, next) => {
  try {
    // Requête optimisée mongoDB : tri et limite
    const bestRatedBooks = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.status(200).json(bestRatedBooks);
  } catch (error) {
    res.status(400).json({ error });
  }
};