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
