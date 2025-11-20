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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
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

  const [colors, setColors] = useState([]); // new
  const [selectedColors, setSelectedColors] = useState([]); // allow multiple

  const fetchColors = async () => {
    try {
      const res = await api.get('/sets/colors');
      // normalize to array of strings (use the appropriate property name from your API)
      const colorStrings = (res.data || []).map(c => c.color ?? c.name ?? String(c));
      setColors(colorStrings);
    } catch (err) {
      console.error('Failed to fetch colors:', err);
    }
  };

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

  // load colors once (or when needed)
  useEffect(() => {
    fetchColors();
  }, []);

  // derive displayed results based on selectedColors (show all when none selected)
  const normalizedSelected = selectedColors.map(c => String(c).toLowerCase().trim());
  const displayedResults = searchResults.filter(piece => {
    if (normalizedSelected.length === 0) return true;
    const pieceColor = String(piece.piece_color || '').toLowerCase().trim();
    return normalizedSelected.includes(pieceColor);
  });

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

      {/* Color selector populated from fetchColors */}
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
          <InputLabel id={`color-select-label`}>Color</InputLabel>
          <Select
            labelId={`color-select-label`}
            multiple
            value={selectedColors}
            label="Color"
            onChange={(e) => {
              const val = e.target.value;
              const arr = typeof val === 'string' ? val.split(',') : val;
              // if the clear token was selected, clear all
              if (arr.includes('__clear__')) {
                setSelectedColors([]);
                return;
              }
              // otherwise set filtered values
              setSelectedColors(arr.filter(Boolean));
            }}
            renderValue={(selected) => (selected.length ? selected.join(', ') : 'All')}
          >
            <MenuItem
              key="clear"
              value="__clear__"
              disabled={selectedColors.length === 0}
              onClick={(e) => {
                // stop propagation so the menu doesn't re-open and apply a value
                e.stopPropagation();
                setSelectedColors([]);
              }}
            >
              <ListItemText primary="Clear selection" />
            </MenuItem>

            {colors.map((c) => (
              <MenuItem key={c} value={c}>
                <Checkbox checked={selectedColors.indexOf(c) > -1} />
                <ListItemText primary={c} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && <CircularProgress />}

      {displayedResults.map((piece) => (
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
