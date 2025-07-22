require('dotenv').config();
const { fetchSetParts } = require('./utils/rebrickable');

async function runTest() {
  const setNumber = '10265'; // Example: Creator Expert Ford Mustang
  try {
    const pieces = await fetchSetParts(setNumber);
    console.log(`Fetched ${pieces.length} pieces:`);
    console.log(pieces.slice(0, 5)); // show first 5 for brevity
  } catch (err) {
    console.error('Error fetching parts:', err.message);
  }
}

runTest();
