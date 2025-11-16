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
import SetPiecesTable from './SetPiecesTable';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import useUser from '../hooks/useUser';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

const MySets = () => {
  const user = useUser();
  const firebaseUid = user?.uid;
  
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuildId, setSelectedBuildId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buildIdToDelete, setSetIdToDelete] = useState(null);

  const fetchSets = (firebaseUid) => {
    setLoading(true);
    console.log('Fetching sets for firebaseUid:', firebaseUid);
    api.get('/sets', { params: { firebaseUid } })
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
    setSelectedBuildId(null);
    fetchSets(user.uid); // Refetch sets when going back
  };

  const handleDelete = () => {
    if (!buildIdToDelete) return;

    api.delete(`/sets/${buildIdToDelete}`, { params: { firebaseUid } })
      .then(() => {
        fetchSets(user.uid);
      })
      .catch(err => console.error('Failed to delete set:', err))
      .finally(() => {
        setDeleteDialogOpen(false);
        setSetIdToDelete(null);
      });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ position: 'relative', minHeight: 400 }}>
      <Slide direction="right" in={!selectedBuildId} mountOnEnter unmountOnExit>
        <div style={{ position: 'absolute', width: '100%' }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Set Number</TableCell>
                  <TableCell>Set Name</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Owned / Total</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sets.map(set => {
                  const percent = Math.round((set.ownedPieces / set.totalPieces) * 100);
                  const imageUrl = set.imageUrl || `https://cdn.rebrickable.com/media/sets/${set.setNumber}.jpg`;
                  return (
                    <TableRow
                      key={set.buildId}
                      hover
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedBuildId(set.buildId)}
                    >
                      <TableCell>
                        <img
                          src={imageUrl}
                          alt={set.name}
                          style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8 }}
                          onError={e => { e.target.src = 'https://cdn.rebrickable.com/media/sets/placeholder.jpg'; }}
                        />
                      </TableCell>
                      <TableCell>{set.setNumber}</TableCell>
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
                      <TableCell>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation(); // prevent row click
                            setSetIdToDelete(set.buildId); // store which set to delete
                            setDeleteDialogOpen(true); // open confirmation dialog
                          }}
                          aria-label="delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Slide>
      <Slide direction="left" in={!!selectedBuildId} mountOnEnter unmountOnExit>
        <div style={{ position: 'absolute', width: '100%' }}>
          <Button
            variant="outlined"
            style={{ margin: '16px 0 16px 16px' }}
            onClick={handleBack}
          >
            Back
          </Button>
          {selectedBuildId && (
            <SetPiecesTable
              buildId={selectedBuildId}
              setName={sets.find(set => set.buildId === selectedBuildId)?.name}
            />
          )}
        </div>
      </Slide>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Set</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this set? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MySets;
