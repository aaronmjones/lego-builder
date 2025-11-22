const express = require('express');
const router = express.Router();
const {
  addSet,
  getSetPieces,
  getMatchingNeededPieces,
  getAllColors,
  getUserProgress,
  updateOwnedPiece,
  getAllSetsWithProgress,
  deleteSet
} = require('../controllers/setsController');

router.post('/', addSet);
router.get('/', getAllSetsWithProgress);
router.get('/pieces/search', getMatchingNeededPieces);
router.get('/:id/pieces', getSetPieces);
router.get('/colors', getAllColors);
router.get('/userprogress', getUserProgress);
router.put('/piece', updateOwnedPiece);
router.delete('/:id', deleteSet);

module.exports = router;
