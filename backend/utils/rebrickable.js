const axios = require('axios');

async function fetchSetParts(setNumber) {
  let url = `https://rebrickable.com/api/v3/lego/sets/${setNumber}/parts/`;
  let allResults = [];

  while (url) {
    const response = await axios.get(url, {
      headers: {
        Authorization: `key ${process.env.REBRICKABLE_API_KEY}`,
      },
    });

    const data = response.data;

    // Filter out spare parts
    const nonSpareParts = data.results.filter(part => !part.is_spare);

    allResults = allResults.concat(nonSpareParts);

    url = data.next; // next page URL or null
  }

  // --- fetch minifigs for the set and include their parts ---
  try {
    let minifigsUrl = `https://rebrickable.com/api/v3/lego/sets/${setNumber}/minifigs/`;
    const minifigList = [];

    while (minifigsUrl) {
      const mfRes = await axios.get(minifigsUrl, {
        headers: { Authorization: `key ${process.env.REBRICKABLE_API_KEY}` },
      });
      const mfData = mfRes.data;
      console.log(`Fetched ${mfData.results.length} minifigs from ${minifigsUrl}`);
      minifigList.push(...(mfData.results || []));
      minifigsUrl = mfData.next;
    }

    // For each minifig, fetch its parts (paginated) and add to allResults
    for (const mf of minifigList) {
      // Try to determine minifig id/num from possible properties
      const minifigNum = mf.minifig_num || mf.minifig?.minifig_num || mf.minifig || mf.set_num;
      if (!minifigNum) continue;

      let mfPartsUrl = `https://rebrickable.com/api/v3/lego/minifigs/${minifigNum}/parts/`;
      while (mfPartsUrl) {
        const mfPartsRes = await axios.get(mfPartsUrl, {
          headers: { Authorization: `key ${process.env.REBRICKABLE_API_KEY}` },
        });
        const mfPartsData = mfPartsRes.data;
        const mfParts = (mfPartsData.results || []).filter(p => !p.is_spare);

        // annotate parts as from a minifig
        const annotated = mfParts.map(p => ({
          ...p,
          from_minifig: true,
          minifig_num: minifigNum
        }));

        allResults = allResults.concat(annotated);
        mfPartsUrl = mfPartsData.next;
      }
    }
  } catch (err) {
    // don't fail entire fetch if minifigs endpoint has issues — log and continue with set parts
    console.error('Failed to fetch minifig parts:', err.message || err);
  }

  // --- dedupe/merge results by part_num + color identifier ---
  const merged = new Map();
  for (const item of allResults) {
    // part object may be at item.part or item.part_part etc. handle common shape
    const part = item.part || item.part_part || {};
    const partNum = part.part_num || part.part_num || item.part_num || '';
    const colorId = (item.color && (item.color.id || item.color.name)) || (part.color && part.color.id) || item.color || '';

    const key = `${partNum}::${colorId || 'no-color'}`;

    const qty = Number(item.quantity || item.qty || item.quantity_in_set || 1) || 0;

    if (merged.has(key)) {
      const existing = merged.get(key);
      existing.quantity = (existing.quantity || 0) + qty;
      // prefer non-minifig metadata if available
      existing.from_minifig = existing.from_minifig && item.from_minifig;
      // keep other fields (image, name) if missing
      if (!existing.part) existing.part = part;
      if (!existing.color) existing.color = item.color || part.color;
    } else {
      merged.set(key, {
        ...item,
        part,
        color: item.color || part.color,
        quantity: qty
      });
    }
  }

  // return merged values as an array
  return Array.from(merged.values());
}

async function setExists(setId) {
  try {
    const response = await axios.get(`https://rebrickable.com/api/v3/lego/sets/${setId}/`, {
      headers: {
        Authorization: `key ${process.env.REBRICKABLE_API_KEY}`,
      },
    });
    return true; // Set exists
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false; // Set not found
    }
    throw error; // Some other error occurred
  }
}

async function getSetName(setId) {
  try {
    const response = await axios.get(`https://rebrickable.com/api/v3/lego/sets/${setId}/`, {
      headers: {
        Authorization: `key ${process.env.REBRICKABLE_API_KEY}`,
      },
    });
    return response.data.name; // Return the set name
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Set doesn't exist
    }
    throw error; // Some other error
  }
}
module.exports = { fetchSetParts, setExists, getSetName };
