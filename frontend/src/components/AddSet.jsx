import React, { useState } from 'react';
import { api } from '../api';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import SetPiecesTable from './SetPiecesTable';
import useUser from '../hooks/useUser';

function AddSet({ onSetAdded }) {
  const user = useUser();
  const userId = user?.uid; // Assuming user object has uid property
  const [setNumber, setSetNumber] = useState('');
  const [addedSetId, setAddedSetId] = useState(null);

  const handleSubmit = async () => {
    try {
      const res = await api.post('/sets', { setNumber, userId });
      const setId = res.data.setId;
      setAddedSetId(setId); // Save the new set ID
      onSetAdded(setId); // Notify parent
    } catch (error) {
      console.error('Failed to add set:', error.response.data.message);

      // Optional: user-facing alert or error state
      alert(`Could not add the set: ${error.response.data.message}`);
      
      // Optional: set error state
      // setError(error.message || 'Unknown error');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <TextField
        label="LEGO Set Number"
        value={setNumber}
        onChange={(e) => setSetNumber(e.target.value)}
        size="small"
        sx={{ height: 40 }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        size="small"
        sx={{ height: 40 }}
      >
        Add Set
      </Button>
      {addedSetId && <SetPiecesTable setId={addedSetId} />}
    </div>
  );
}

export default AddSet;
