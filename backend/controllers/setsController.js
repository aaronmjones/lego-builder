const db = require('../db');
const { fetchSetParts, setExists, getSetName } = require('../utils/rebrickable');

//console.log('API Key:', process.env.REBRICKABLE_API_KEY);
//console.log('Imported fetchSetParts:', fetchSetParts);

async function addSet(req, res) {
  const { setNumber, firebaseUid } = req.body;

  try {
    // Get user_id (insert if not exists)
    // Could this be simplified (see piece insertion with ON CONFLICT)?
    let userId;
    try {
      console.error('Inserting user: ', firebaseUid);
      const setInsert = await db.query(
        'INSERT INTO users (firebase_uid) VALUES ($1) RETURNING user_id',
        [firebaseUid]
      );
      userId = setInsert.rows[0].user_id;
    } catch (err) {
      if (err.code === '23505') {
        // User already exists, get user_id
        const existingUser = await db.query(
          'SELECT user_id FROM users WHERE firebase_uid = $1',
          [firebaseUid]
        );
        userId = existingUser.rows[0].user_id;
      } else {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    // Check if rebrickable set exists and get set name
    if (!setExists(setNumber)) {
      return res.status(400).json({ message: 'Set does not exist' });
    }
    setName = await getSetName(setNumber);
    if (!setName) {
      return res.status(400).json({ message: 'Set name not found' });
    }

    const pieces = await fetchSetParts(setNumber);
    let setId;

    // Get lego_set set_id (insert if not exists)
    // Could this be simplified (see piece insertion with ON CONFLICT)?
    const setInsert = await db.query(
      `INSERT INTO lego_sets (set_number, name)
        VALUES ($1, $2)
        ON CONFLICT (set_number)
        DO UPDATE SET name = EXCLUDED.name -- // dummy update to avoid error
        RETURNING set_id`,
      [setNumber, setName]
    );
    setId = setInsert.rows[0].set_id;

    // Insert new entry in user_builds
    let buildId;
    if (firebaseUid && setId) {
      const userBuildInsert = await db.query(
        `INSERT INTO user_builds (user_id, set_id, instance_number)
         SELECT
           $1,
           $2,
           COALESCE(MAX(instance_number) + 1, 1)
        FROM user_builds
        WHERE user_id = $1 AND set_id = $2
        RETURNING build_id;`,
        [userId, setId]
      );
      buildId = userBuildInsert.rows[0].build_id;
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

      // Add piece to pieces table (if not exists)
      const pieceInsert = await db.query(
        `INSERT INTO pieces (part_num, name, color, image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (part_num, name, color)
         DO UPDATE SET part_num = EXCLUDED.part_num  -- dummy update
         RETURNING piece_id`,
        [partNum, name, color, imageUrl]
      );
      const pieceId = pieceInsert.rows[0].piece_id;

      // add piece to set_pieces (if not exists)
      await db.query(
        `INSERT INTO set_pieces (set_id, piece_id, required_qty)
         VALUES ($1, $2, $3)
         ON CONFLICT (set_id, piece_id) DO NOTHING`,
        [setId, pieceId, quantity]
      );

      if (buildId) {
        await db.query(
          `INSERT INTO build_pieces (build_id, piece_id)
          VALUES ($1, $2)`,
          [buildId, pieceId]
        );
      }

    }

    res.status(201).json({ message: 'Set added', buildId, setId, setName });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to add set' });
  }
}

// TODO: Rename to getBuildPieces
async function getSetPieces(req, res) {
  const { id } = req.params; // build id
  const firebaseUid = req.query.firebaseUid;

  console.log('getSetPieces req.params:', req.params, 'req.query:', req.query);

  // validate id
  const buildId = Number(id);
  if (!id || Number.isNaN(buildId)) {
    return res.status(400).json({ error: 'Missing or invalid build id' });
  }
  if (!firebaseUid) {
    return res.status(400).json({ error: 'Missing firebaseUid' });
  }

  try {
    const result = await db.query(
      `SELECT
        p.piece_id,
        p.name,
        p.color,
        p.image_url,
        sp.required_qty AS required_qty,
        COALESCE(bp.quantity_found, 0) AS owned_qty
      FROM users u
      JOIN user_builds ub
         ON ub.user_id = u.user_id
      JOIN set_pieces sp
         ON sp.set_id = ub.set_id
      JOIN pieces p
         ON p.piece_id = sp.piece_id
      LEFT JOIN build_pieces bp
         ON bp.build_id = ub.build_id
        AND bp.piece_id = sp.piece_id
      WHERE ub.build_id = $1
        AND u.firebase_uid = $2
      ORDER BY p.piece_id;`,
      [buildId, firebaseUid]
    );

    console.log('Fetched pieces for set:', buildId, 'User ID:', firebaseUid);
    console.log('Result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('getSetPieces error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// TODO: Pass in current owned quantity and new owned quantity. Check to make
// sure current quantity has not changed since last fetch.
async function updateOwnedPiece(req, res) {
  console.log('updateOwnedPice');

  const { buildId, pieceId, owned_qty, firebaseUid } = req.body;

  console.log('Updating owned piece:', {
    buildId, firebaseUid, pieceId, owned_qty });
  await db.query(
    `UPDATE build_pieces
     SET quantity_found = $3
     WHERE build_id = $1
      AND piece_id = $2`,
    [buildId, pieceId, owned_qty]
  );

  res.json({ message: 'Owned quantity updated' });
}

// TODO: Rename to getUserBuildsWithProgress
async function getAllSetsWithProgress(req, res) {
  console.log('Fetching user sets with progress');
  const firebaseUid = req.query.firebaseUid;

  if (!firebaseUid) {
    return res.status(400).json({ error: 'Missing firebaseUid' });
  }

  console.log('Fetching sets for firebaseUid:', firebaseUid);
  const result = await db.query(
    `SELECT
      ub.build_id,
      ub.instance_number,
      ls.set_id,
      ls.set_number,
      ls.name,
      COALESCE(SUM(bp.quantity_found), 0) AS ownedpieces,
      COALESCE(SUM(sp.required_qty), 0) AS totalpieces
    FROM users u
    JOIN user_builds ub ON ub.user_id = u.user_id
    JOIN lego_sets ls ON ub.set_id = ls.set_id
    JOIN set_pieces sp ON ls.set_id = sp.set_id
    LEFT JOIN build_pieces bp
      ON bp.build_id = ub.build_id
     AND bp.piece_id = sp.piece_id
    WHERE u.firebase_uid = $1
    GROUP BY ub.build_id, ls.set_id, ls.set_number, ls.name
    ORDER BY ls.set_id;`,
    [firebaseUid]
  );

  console.log('Fetched sets:', result.rows);

  res.json(result.rows.map(row => ({
    buildId: row.build_id,
    instanceNumber: row.instance_number,
    setId: row.set_id,
    setNumber: row.set_number,
    name: row.name,
    ownedPieces: Number(row.ownedpieces),
    totalPieces: Number(row.totalpieces)
  })));
}

async function getMatchingNeededPieces(req, res) {
  const { query, firebaseUid } = req.query;

  console.log('Searching pieces for firebaseUid:', firebaseUid, 'with query:', query);

  if (!firebaseUid || !query) {
    return res.status(400).json({ error: 'Missing firebaseUid or query' });
  }

  try {
    const totalsMap = new Map();
    {
      const { rows } = await db.query(
        `SELECT
          ub.build_id,
          ls.set_id,
          ls.set_number,
          ls.name,
          COALESCE(SUM(bp.quantity_found), 0) AS totalowned,
          COALESCE(SUM(sp.required_qty), 0) AS totalrequired
        FROM users u
        JOIN user_builds ub ON ub.user_id = u.user_id
        JOIN lego_sets ls ON ub.set_id = ls.set_id
        JOIN set_pieces sp ON ls.set_id = sp.set_id
        LEFT JOIN build_pieces bp
          ON bp.build_id = ub.build_id
        AND bp.piece_id = sp.piece_id
        WHERE u.firebase_uid = $1
        GROUP BY ub.build_id, ls.set_id, ls.set_number, ls.name
        ORDER BY ls.set_id;`,
        [firebaseUid]
      );

      rows.forEach(row => {
        const {
          build_id,
          totalowned,
          totalrequired
        } = row;
        totalsMap.set(build_id, {
          totalowned: Number(totalowned),
          totalrequired: Number(totalrequired)
        });
      });
    }

    const sql = `
    SELECT
      p.piece_id,
      p.name AS piece_name,
      p.color AS piece_color,
      p.image_url AS piece_img,
      s.set_id,
      s.name AS set_name,
      s.set_number,
      sp.required_qty,
      COALESCE(bp.quantity_found, 0) AS owned_qty,
      ub.build_id,
      ub.instance_number
    FROM users u
    JOIN user_builds ub
      ON u.user_id = ub.user_id
    JOIN lego_sets s
      ON s.set_id = ub.set_id
    JOIN set_pieces sp
      ON sp.set_id = s.set_id
    JOIN pieces p
      ON p.piece_id = sp.piece_id
    LEFT JOIN build_pieces bp
      ON bp.build_id = ub.build_id
      AND bp.piece_id = p.piece_id
    WHERE u.firebase_uid = $1
      AND p.name ILIKE '%' || $2 || '%'
    ORDER BY ub.build_id, p.piece_id;
    `;

    const { rows } = await db.query(sql, [firebaseUid, query]);

    // Group results by piece
    const resultMap = new Map();

    rows.forEach(row => {
      const {
        piece_id,
        piece_name,
        piece_color,
        piece_img,
        set_id,
        set_name,
        set_number,
        required_qty,
        owned_qty,
        build_id,
        instance_number
      } = row;

      if (!resultMap.has(piece_id)) {
        resultMap.set(piece_id, {
          piece_id,
          piece_name,
          piece_color,
          piece_img,
          sets: []
        });
      }

      resultMap.get(piece_id).sets.push({
        build_id,
        instance_number,
        set_id,
        set_name,
        set_number,
        set_img: `https://cdn.rebrickable.com/media/sets/${set_number}.jpg`, // Example image URL format
        required_qty,
        owned_qty,
        totalowned: Number(totalsMap.get(build_id).totalowned),
        totalrequired: Number(totalsMap.get(build_id).totalrequired),
      });
    });

    const response = Array.from(resultMap.values());
    res.json(response);
  } catch (err) {
    console.error('Error during piece search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// TODO: Rename to deleteBuild
async function deleteSet(req, res) {
  const { id } = req.params;
  const firebaseUid = req.query.firebaseUid;

  if (!firebaseUid) {
    return res.status(400).json({ error: 'Missing firebaseUid' });
  }

  try {
    await db.query(
      `DELETE FROM user_builds WHERE build_id = $1`,
      [id]
    );

    res.json({ message: 'Set deleted successfully' });
  } catch (err) {
    console.error('Error deleting set:', err);
    res.status(500).json({ error: 'Failed to delete set' });
  }
}

async function getAllColors(req, res) {
  try {
    const result = await db.query(`
      SELECT DISTINCT color
      FROM pieces
      WHERE color IS NOT NULL
      ORDER BY color;
      `);

    res.json(result.rows.map(row => ({
      color: row.color
    })));
  } catch (err) {
    console.error('Error retrieving colors:', err);
    res.status(500).json({ error: 'Failed to retrieve colors' });
  }
}

module.exports = { addSet, getSetPieces, updateOwnedPiece, getAllSetsWithProgress, getMatchingNeededPieces, getAllColors, deleteSet };
