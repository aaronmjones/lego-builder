import React, { useEffect, useState } from 'react';
import { api } from '../api';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import PieceTable from './PieceTable';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import useUser from '../hooks/useUser';

const MySetsTable = () => {
  const user = useUser();
  const userId = user?.uid; // Assuming user object has uid property
  
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState(null);

  const fetchSets = (userId) => {
    setLoading(true);
    console.log('Fetching sets for userId:', userId);
    api.get('/sets', { params: { userId } })
      .then(res => setSets(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.uid) {
      fetchSets(user.uid);
    }
  }, [user]);

  const handleBack = () => {
    setSelectedSetId(null);
    fetchSets(user.uid); // Refetch sets when going back
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ position: 'relative', minHeight: 400 }}>
      <Slide direction="right" in={!selectedSetId} mountOnEnter unmountOnExit>
        <div style={{ position: 'absolute', width: '100%' }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Set Name</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Owned / Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sets.map(set => {
                  const percent = Math.round((set.ownedPieces / set.totalPieces) * 100);
                  const imageUrl = set.imageUrl || `https://cdn.rebrickable.com/media/sets/${set.setNumber}.jpg`;
                  return (
                    <TableRow
                      key={set.id}
                      hover
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedSetId(set.id)}
                    >
                      <TableCell>
                        <img
                          src={imageUrl}
                          alt={set.name}
                          style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8 }}
                          onError={e => { e.target.src = 'https://cdn.rebrickable.com/media/sets/placeholder.jpg'; }}
                        />
                      </TableCell>
                      <TableCell>{set.name}</TableCell>
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
                      <TableCell>
                        {set.ownedPieces} / {set.totalPieces}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Slide>
      <Slide direction="left" in={!!selectedSetId} mountOnEnter unmountOnExit>
        <div style={{ position: 'absolute', width: '100%' }}>
          <Button
            variant="outlined"
            style={{ margin: '16px 0 16px 16px' }}
            onClick={handleBack}
          >
            Back
          </Button>
          {selectedSetId && (
            <PieceTable
              setId={selectedSetId}
              setName={sets.find(set => set.id === selectedSetId)?.name}
            />
          )}
        </div>
      </Slide>
    </div>
  );
};

export default MySetsTable;