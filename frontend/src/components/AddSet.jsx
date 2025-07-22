import React, { useState } from 'react';
import { api } from '../api';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

function AddSet({ onSetAdded }) {
  const [setNumber, setSetNumber] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await api.post('/sets', { setNumber });
      const setId = res.data.setId;
      onSetAdded(setId); // Notify parent
    } catch (error) {
      console.error('Failed to add set:', error);
      console.error('Failed to add set:', error.response.data.message);

      // Optional: user-facing alert or error state
      alert(`Could not add the set: ${error.response.data.message}`);
      
      // Optional: set error state
      // setError(error.message || 'Unknown error');
    }
  };

  return (
    <div>
      <TextField
        label="LEGO Set Number"
        value={setNumber}
        onChange={(e) => setSetNumber(e.target.value)}
      />
      <Button variant="contained" onClick={handleSubmit}>
        Add Set
      </Button>
    </div>
  );
}

export default AddSet;
