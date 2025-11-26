import React, { useState } from 'react';
import { api } from '../api';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import useUser from '../hooks/useUser';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

function AddSet({ onSetAdded }) {
  const user = useUser();
  const firebaseUid = user?.uid;
  const [setNumber, setSetNumber] = useState('');
  const [addedBuildId, setAddedBuildId] = useState(null);
  const [addedSetName, setAddedSetName] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await api.post('/sets', { setNumber, firebaseUid });
      const buildId = res.data.buildId;
      setAddedBuildId(buildId); // Save the new set ID
      setAddedSetName(res.data.setName); // Save the new set name
      onSetAdded(buildId); // Notify parent
    } catch (error) {
      console.error('Failed to add set:', error.response.data.message);

      // Optional: user-facing alert or error state
      alert(`Could not add the set: ${error.response.data.message}`);
    }
  };

  return (
    <Stack spacing={2} sx={{ padding: 2 }}>
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
      <Tooltip title="For example: 60052-1 (not 60052). '-1' is usually required at the end.">
        <IconButton size="small">
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>
    </div>
    </Stack>
  );
}

export default AddSet;
