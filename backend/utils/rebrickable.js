const axios = require('axios');

// async function fetchSetParts(setNumber) {
//   const response = await axios.get(
//     `https://rebrickable.com/api/v3/lego/sets/${setNumber}/parts/`,
//     {
//       headers: {
//         Authorization: `key ${process.env.REBRICKABLE_API_KEY}`,
//       },
//     }
//   );
//   //console.log('Full response:', response.data);
//   return response.data.results;
// }

async function fetchSetParts(setNum) {
  const apiKey = process.env.REBRICKABLE_API_KEY;
  let url = `https://rebrickable.com/api/v3/lego/sets/${setNum}/parts/?page_size=100`;
  let allParts = [];

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `key ${apiKey}`
      }
    });

    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

    const data = await res.json();

    // ❌ Filter out spare parts
    const filtered = data.results.filter(p => !p.is_spare);
    allParts = allParts.concat(filtered);

    url = data.next; // If there's another page, this will be the next URL
  }

  console.log(`Fetched ${allParts.length} parts.`);
  return allParts;
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
