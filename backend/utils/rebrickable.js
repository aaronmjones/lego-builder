const axios = require('axios');

async function fetchSetParts(setNumber) {
  const response = await axios.get(
    `https://rebrickable.com/api/v3/lego/sets/${setNumber}/parts/`,
    {
      headers: {
        Authorization: `key ${process.env.REBRICKABLE_API_KEY}`,
      },
    }
  );
  //console.log('Full response:', response.data);
  return response.data.results;
}

module.exports = { fetchSetParts };
