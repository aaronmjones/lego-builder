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

const SetTable = () => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState(null);

  useEffect(() => {
    const userId = 1; // Replace with actual user ID if needed
    api.get(`/sets?userId=${userId}`)
      .then(res => {
        setSets(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Set ID</TableCell>
              <TableCell>Set Name</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Owned / Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sets.map(set => {
              const percent = Math.round((set.ownedPieces / set.totalPieces) * 100);
              return (
                <TableRow
                  key={set.id}
                  hover
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedSetId(set.id)}
                >
                  <TableCell>{set.id}</TableCell>
                  <TableCell>{set.name}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{ height: 10, borderRadius: 5, flex: 1 }}
                      />
                      <span style={{ marginLeft: 8, minWidth: 40 }}>{percent}%</span>
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
      {selectedSetId && (
        <PieceTable setId={selectedSetId} />
      )}
    </>
  );
};

export default SetTable;