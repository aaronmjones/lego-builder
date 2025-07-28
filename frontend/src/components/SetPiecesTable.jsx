import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
    Table, TableBody, TableCell, TableHead, TableRow,
    TextField, Typography, IconButton, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import useUser from '../hooks/useUser';

function SetPiecesTable({ setId, setName }) {
    const user = useUser();
    const userId = user?.uid; // Assuming user object has uid property
    console.log('Current userId:', userId); // <-- Add this line
    const [pieces, setPieces] = useState([]);

    useEffect(() => {
        if (!userId) return;
        api.get(`/sets/${setId}/pieces`, { params: { userId } })
            .then((res) => setPieces(res.data));
    }, [setId, userId]);

    const handleOwnedChange = (pieceId, value, userId) => {
        const parsedQty = Math.max(0, parseInt(value, 10) || 0);
        const piece = pieces.find(p => p.piece_id === pieceId);
        const maxQty = piece ? piece.required_qty : Infinity;
        const finalQty = Math.min(parsedQty, maxQty);

        console.log(`Updating piece ${pieceId} owned quantity to ${finalQty}`);
        api.put('/sets/piece', {
            setId,
            pieceId,
            owned_qty: finalQty,
            userId: userId
        }).then(() => {
            setPieces((prev) =>
                prev.map((p) =>
                    p.piece_id === pieceId ? { ...p, owned_qty: finalQty } : p
                )
            );
        }).catch((err) => {
            console.error('Error updating piece:', err);
        });
    };

    const handleIncrement = (piece) => {
        if ((piece.owned_qty || 0) < piece.required_qty) {
            handleOwnedChange(piece.piece_id, (piece.owned_qty || 0) + 1, user?.uid);
        }
    };

    const handleDecrement = (piece) => {
        if ((piece.owned_qty || 0) > 0) {
            handleOwnedChange(piece.piece_id, (piece.owned_qty || 0) - 1, user?.uid);
        }
    };

    return (
        <div>
            <Typography variant="h6">Pieces for {setName}</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Image</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell>Owned</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pieces.map((piece) => (
                        <TableRow key={piece.piece_id}>
                            <TableCell><img src={piece.image_url} alt="" width="40" /></TableCell>
                            <TableCell>{piece.name}</TableCell>
                            <TableCell>{piece.color}</TableCell>
                            <TableCell>{piece.required_qty}</TableCell>
                            <TableCell>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDecrement(piece)}
                                        disabled={(piece.owned_qty || 0) <= 0}
                                        sx={{ marginRight: 1 }}
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                    <span style={{ minWidth: 32, textAlign: 'center', fontSize: 16 }}>
                                        {piece.owned_qty || 0}
                                    </span>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleIncrement(piece)}
                                        disabled={(piece.owned_qty || 0) >= piece.required_qty}
                                        sx={{ marginLeft: 1 }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default SetPiecesTable;
