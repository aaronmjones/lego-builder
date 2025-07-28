const db = require('../db');
const { fetchSetParts } = require('../utils/rebrickable');

//console.log('API Key:', process.env.REBRICKABLE_API_KEY);
//console.log('Imported fetchSetParts:', fetchSetParts);

async function addSet(req, res) {
  const { setNumber, userId } = req.body;

  try {
    const pieces = await fetchSetParts(setNumber);
    let setId;

    // Try to insert the set, or get its set_id if it already exists
    // FIXME: Get the set name from rebrickable; don't use "Set ${setNumber}"
    try {
      const setInsert = await db.query(
        'INSERT INTO lego_sets (set_number, name) VALUES ($1, $2) RETURNING set_id',
        [setNumber, `Set ${setNumber}`]
      );
      setId = setInsert.rows[0].set_id;
    } catch (err) {
      if (err.code === '23505') {
        // Set already exists, get its set_id
        const existingSet = await db.query(
          'SELECT set_id FROM lego_sets WHERE set_number = $1',
          [setNumber]
        );
        setId = existingSet.rows[0].set_id;
      } else {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    // Always insert into user_lego_sets after setId is determined
    if (userId && setId) {
      await db.query(
        `INSERT INTO user_lego_sets (user_id, set_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, set_id) DO NOTHING`,
        [userId, setId]
      );
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
  const userId = req.query.userId;

  const result = await db.query(
    `SELECT lp.piece_id, lp.name, lp.color, lp.image_url,
            sp.required_qty,
            usp.owned_qty
     FROM set_pieces sp
     JOIN lego_pieces lp ON lp.piece_id = sp.piece_id
     LEFT JOIN user_set_pieces usp
     ON usp.set_id = sp.set_id AND usp.piece_id = sp.piece_id AND usp.user_id = $2
     WHERE sp.set_id = $1`,
    [id, userId]
  );

  console.log('Fetched pieces for set:', id, 'User ID:', userId);
  console.log('Result:', result.rows);
  res.json(result.rows);
}

async function updateOwnedPiece(req, res) {
  console.log('updateOwnedPice');

  const { setId, pieceId, owned_qty, userId } = req.body;

  console.log('Updating owned piece:', {
    setId, userId, pieceId, owned_qty });
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
  console.log('Fetching user sets with progress');
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  console.log('Fetching sets for userId:', userId);
  const result = await db.query(
    `SELECT 
        s.set_id AS id,
        s.set_number,
        s.name,
        COALESCE(SUM(usp.owned_qty), 0) AS ownedpieces,
        COALESCE(SUM(sp.required_qty), 0) AS totalpieces
     FROM user_lego_sets uls
     JOIN lego_sets s ON uls.set_id = s.set_id
     JOIN set_pieces sp ON s.set_id = sp.set_id
     LEFT JOIN user_set_pieces usp 
       ON usp.set_id = s.set_id AND usp.piece_id = sp.piece_id AND usp.user_id = $1
     WHERE uls.user_id = $1
     GROUP BY s.set_id, s.set_number, s.name
     ORDER BY s.set_id`,
    [userId]
  );

  console.log('Fetched sets:', result.rows);

  res.json(result.rows.map(row => ({
    id: row.id,
    setNumber: row.set_number,
    name: row.name,
    ownedPieces: Number(row.ownedpieces),
    totalPieces: Number(row.totalpieces)
  })));
}

async function getMatchingNeededPieces(req, res) {
  const { query, userId } = req.query;

  console.log('Searching pieces for userId:', userId, 'with query:', query);

  if (!userId || !query) {
    return res.status(400).json({ error: 'Missing userId or query' });
  }

  try {
    const sql = `
      SELECT
        p.piece_id,
        p.name AS piece_name,
        p.image_url AS piece_img,
        s.set_id,
        s.name AS set_name,
        s.set_number,
        sp.required_qty,
        COALESCE(usp.owned_qty, 0) AS owned_qty
      FROM lego_pieces p
      JOIN set_pieces sp ON p.piece_id = sp.piece_id
      JOIN lego_sets s ON s.set_id = sp.set_id
      JOIN user_lego_sets uls ON uls.set_id = s.set_id
      LEFT JOIN user_set_pieces usp
        ON usp.set_id = s.set_id
        AND usp.piece_id = p.piece_id
        AND usp.user_id = uls.user_id
      WHERE uls.user_id = $1
        AND p.name ILIKE '%' || $2 || '%'
    `;

    const { rows } = await db.query(sql, [userId, query]);

    // Group results by piece
    const resultMap = new Map();

    rows.forEach(row => {
      const {
        piece_id,
        piece_name,
        piece_img,
        set_id,
        set_name,
        set_number,
        required_qty,
        owned_qty
      } = row;

      if (!resultMap.has(piece_id)) {
        resultMap.set(piece_id, {
          piece_id,
          piece_name,
          piece_img,
          sets: []
        });
      }

      resultMap.get(piece_id).sets.push({
        set_id,
        set_name,
        set_img: `https://cdn.rebrickable.com/media/sets/${set_number}.jpg`, // Example image URL format
        required_qty,
        owned_qty
      });
    });

    const response = Array.from(resultMap.values());
    res.json(response);
  } catch (err) {
    console.error('Error during piece search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function deleteSet(req, res) {
  const { id } = req.params;
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // Delete from user_lego_sets
    await db.query(
      `DELETE FROM user_lego_sets WHERE user_id = $1 AND set_id = $2`,
      [userId, id]
    );

    // Delete from user_set_pieces
    await db.query(
      `DELETE FROM user_set_pieces WHERE user_id = $1 set_id = $2`,
      [userId, id]
    );

    // // Delete from lego_sets
    // await db.query(
    //   `DELETE FROM lego_sets WHERE set_id = $1`,
    //   [id]
    // );

    // // Delete from set_pieces
    // await db.query(
    //   `DELETE FROM set_pieces WHERE set_id = $1`,
    //   [id]
    // );

    // // Delete from lego_pieces (optional, if no longer used)
    // await db.query(
    //   `DELETE FROM lego_pieces WHERE piece_id NOT IN (SELECT piece_id FROM set_pieces)`,
    //   []
    // );

    res.json({ message: 'Set deleted successfully' });
  } catch (err) {
    console.error('Error deleting set:', err);
    res.status(500).json({ error: 'Failed to delete set' });
  }
}

module.exports = { addSet, getSetPieces, updateOwnedPiece, getAllSetsWithProgress, getMatchingNeededPieces, deleteSet };
