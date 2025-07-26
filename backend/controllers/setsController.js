const db = require('../db');
const { fetchSetParts } = require('../utils/rebrickable');

//console.log('API Key:', process.env.REBRICKABLE_API_KEY);
//console.log('Imported fetchSetParts:', fetchSetParts);

async function addSet(req, res) {
  const { setNumber } = req.body;

  try {
    const pieces = await fetchSetParts(setNumber);
    //console.log('Fetched pieces:', pieces);
    let setId;

    try {
      const setInsert = await db.query(
        'INSERT INTO lego_sets (set_number, name) VALUES ($1, $2) RETURNING set_id',
        [setNumber, `Set ${setNumber}`]
      );

      setId = setInsert.rows[0].set_id;
      //res.status(201).json({ message: 'Set added', setId });
    } catch (err) {
      if (err.code === '23505') {
        // PostgreSQL unique_violation error code
        console.error('Database error:', err);
        return res.status(409).json({ message: `Set ${setNumber} already exists` });
      }

      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    for (let piece of pieces) {
      const partNum = piece.part.part_num;
      const name = piece.part.name || 'Unnamed';
      const color = piece.color.name;
      const imageUrl = piece.part.part_img_url || '';
      const quantity = piece.quantity;

      // Log the piece before inserting
      console.log(`Inserting piece:`, {
        partNum,
        name,
        color,
        imageUrl,
        quantity
      });

      const pieceInsert = await db.query(
        `INSERT INTO lego_pieces (part_num, name, color, image_url)
         VALUES ($1, $2, $3, $4)
         RETURNING piece_id`,
        [partNum, name, color, imageUrl]
      );

      const pieceId = pieceInsert.rows[0].piece_id;

      console.log('Inserting into set_pieces');
      await db.query(
        `INSERT INTO set_pieces (set_id, piece_id, required_qty)
         VALUES ($1, $2, $3)`,
        [setId, pieceId, quantity]
      );
    }

    res.status(201).json({ message: 'Set added', setId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to add set' });
  }
}

async function getSetPieces(req, res) {
  const { id } = req.params;

  const result = await db.query(
    `SELECT lp.piece_id, lp.name, lp.color, lp.image_url,
            sp.required_qty,
            usp.owned_qty
     FROM set_pieces sp
     JOIN lego_pieces lp ON lp.piece_id = sp.piece_id
     LEFT JOIN user_set_pieces usp
     ON usp.set_id = sp.set_id AND usp.piece_id = sp.piece_id AND usp.user_id = 1
     WHERE sp.set_id = $1`,
    [id]
  );

  res.json(result.rows);
}

async function updateOwnedPiece(req, res) {
  const { userId = 1, setId, pieceId, owned_qty } = req.body;

  await db.query(
    `INSERT INTO user_set_pieces (user_id, set_id, piece_id, owned_qty)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, set_id, piece_id)
     DO UPDATE SET owned_qty = $4`,
    [userId, setId, pieceId, owned_qty]
  );

  res.json({ message: 'Owned quantity updated' });
}

async function getAllSetsWithProgress(req, res) {
  const userId = req.query.userId ? Number(req.query.userId) : 1; // fallback to 1 if not provided

  const result = await db.query(
    `SELECT 
        s.set_id AS id,
        s.set_number,
        s.name,
        COALESCE(SUM(usp.owned_qty), 0) AS ownedpieces,
        COALESCE(SUM(sp.required_qty), 0) AS totalpieces
     FROM lego_sets s
     JOIN set_pieces sp ON s.set_id = sp.set_id
     LEFT JOIN user_set_pieces usp 
       ON usp.set_id = s.set_id AND usp.piece_id = sp.piece_id AND usp.user_id = $1
     GROUP BY s.set_id, s.set_number, s.name
     ORDER BY s.set_id`
    , [userId]
  );

  res.json(result.rows.map(row => ({
    id: row.id,
    setNumber: row.set_number,
    name: row.name,
    ownedPieces: Number(row.ownedpieces),
    totalPieces: Number(row.totalpieces)
  })));
}

module.exports = { addSet, getSetPieces, updateOwnedPiece, getAllSetsWithProgress };
