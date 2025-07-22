const express = require('express');
const router = express.Router();
const {
  addSet,
  getSetPieces,
  updateOwnedPiece,
} = require('../controllers/setsController');

router.post('/', addSet);
router.get('/:id/pieces', getSetPieces);
router.put('/piece', updateOwnedPiece);

module.exports = router;
