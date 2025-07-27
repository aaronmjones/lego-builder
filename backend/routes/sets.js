const express = require('express');
const router = express.Router();
const {
  addSet,
  getSetPieces,
  getMatchingNeededPieces,
  updateOwnedPiece,
  getAllSetsWithProgress
} = require('../controllers/setsController');

router.post('/', addSet);
router.get('/', getAllSetsWithProgress);
router.get('/pieces/search', getMatchingNeededPieces);
router.get('/:id/pieces', getSetPieces);
router.put('/piece', updateOwnedPiece);

module.exports = router;
