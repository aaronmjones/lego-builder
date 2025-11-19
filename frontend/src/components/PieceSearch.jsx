import React, { useState, useEffect } from 'react';
import {
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LinearProgress from '@mui/material/LinearProgress';
import RemoveIcon from '@mui/icons-material/Remove';
import debounce from 'lodash.debounce';
import useUser from '../hooks/useUser';
import { api } from '../api';

const PieceSearch = () => {
  const user = useUser();
  const firebaseUid = user?.uid;
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const fetchResults = debounce(async (searchTerm) => {
    if (!searchTerm || !firebaseUid) return;

    setLoading(true);
    try {
      const res = await api.get('/sets/pieces/search', {
        params: { query: searchTerm, firebaseUid }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, 400); // 400ms debounce

  useEffect(() => {
    fetchResults(query);

    // Cleanup debounce on unmount
    return () => fetchResults.cancel();
  }, [query, firebaseUid]);

  const handleOwnedChange = (set, piece, value, firebaseUid) => {
      const parsedQty = Math.max(0, parseInt(value, 10) || 0);
      const maxQty = set ? set.required_qty : Infinity;
      const finalQty = Math.min(parsedQty, maxQty);

      console.log(`Updating piece ${piece.piece_id} owned quantity to ${finalQty}`);
      api.put('/sets/piece', {
          buildId: set.build_id,
          pieceId: piece.piece_id,
          owned_qty: finalQty,
          firebaseUid: firebaseUid
      }).then(() => {
          setSearchResults((prev) =>
              prev.map((p) =>
                  p.piece_id === piece.piece_id
                    ? {
                        ...p,
                        sets: p.sets.map((s) =>
                          s.build_id === set.build_id ? { ...s, owned_qty: finalQty } : s
                        )
                      }
                    : p
              )
          );
      }).catch((err) => {
          console.error('Error updating piece:', err);
      });
  };

  const handleIncrement = (set, piece) => {
    console.log('Incrementing piece:', piece, set);
    if ((set.owned_qty || 0) < set.required_qty) {
        handleOwnedChange(set, piece, (set.owned_qty || 0) + 1, user?.uid);
    }
  };

  const handleDecrement = (set, piece) => {
    console.log('Decrementing piece:', piece, set);
    if ((set.owned_qty || 0) > 0) {
        handleOwnedChange(set, piece, (set.owned_qty || 0) - 1, user?.uid);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Search LEGO Pieces
      </Typography>

      <TextField
        label="Search for a piece"
        variant="outlined"
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 3 }}
      />

      {loading && <CircularProgress />}

      {searchResults.map((piece) => (
        <Box key={piece.piece_id} mb={4}>
          <Typography variant="h6">{piece.piece_name}</Typography>
          <Typography variant="h8">{piece.piece_color}</Typography>
          <Box display="flex" alignItems="center" mb={2}>
            <img
              src={piece.piece_img}
              alt={piece.piece_name}
              style={{ height: 60, marginRight: 16 }}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Set Image</TableCell>
                  <TableCell>Set Name</TableCell>
                  <TableCell>Build Progress</TableCell>
                  <TableCell align="center">Required</TableCell>
                  <TableCell align="center">Owned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {piece.sets.map((set) => {
                  console.log('totalowned:', set.totalowned, 'totalrequired:', set.totalrequired);
                  const percent = Math.round((set.totalowned / set.totalrequired) * 100);
                  return (
                  <TableRow key={set.build_id}>
                    <TableCell>
                      <img
                        src={set.set_img}
                        alt={set.set_name}
                        style={{ height: 50 }}
                      />
                    </TableCell>
                    <TableCell>{set.set_name}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{
                            height: 20,
                            borderRadius: 10,
                            flex: 1,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#1976d2',
                            },
                          }}
                        />
                        <span style={{ marginLeft: 16 }}>{percent}%</span>
                      </div>
                    </TableCell>
                    <TableCell align="center">{set.required_qty}</TableCell>
                    <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton
                                size="small"
                                onClick={() => handleDecrement(set, piece)}
                                disabled={(set.owned_qty || 0) <= 0}
                                sx={{ marginRight: 1 }}
                            >
                                <RemoveIcon />
                            </IconButton>
                            <span style={{ minWidth: 32, textAlign: 'center', fontSize: 16 }}>
                                {set.owned_qty || 0}
                            </span>
                            <IconButton
                                size="small"
                                onClick={() => handleIncrement(set, piece)}
                                disabled={(set.owned_qty || 0) >= set.required_qty}
                                sx={{ marginLeft: 1 }}
                            >
                                <AddIcon />
                            </IconButton>
                        </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
};

export default PieceSearch;
