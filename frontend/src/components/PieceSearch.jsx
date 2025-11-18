import React, { useState, useEffect } from 'react';
import {
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
                  <TableCell align="center">Required</TableCell>
                  <TableCell align="center">Owned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {piece.sets.map((set) => (
                  <TableRow key={set.set_id}>
                    <TableCell>
                      <img
                        src={set.set_img}
                        alt={set.set_name}
                        style={{ height: 50 }}
                      />
                    </TableCell>
                    <TableCell>{set.set_name}</TableCell>
                    <TableCell align="center">{set.required_qty}</TableCell>
                    <TableCell align="center">{set.owned_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
};

export default PieceSearch;
