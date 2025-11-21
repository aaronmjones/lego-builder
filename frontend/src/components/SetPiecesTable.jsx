import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
    Table, TableBody, TableCell, TableHead, TableRow,
    TextField, Typography, IconButton, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useUser from '../hooks/useUser';

function SetPiecesTable({ buildId, setName }) {
    const user = useUser();
    const firebaseUid = user?.uid; // Assuming user object has uid property
    console.log('Current firebaseUid:', firebaseUid); // <-- Add this line
    const [pieces, setPieces] = useState([]);

    // column widths to match PieceSearch / MySets
    const COL_WIDTHS = {
        image: 100,
        name: 'auto',
        color: 120,
        required: 100,
        haveAll: 100,
        owned: 120
    };

    const SET_NAME_COL_SX = {
        width: COL_WIDTHS.name,
        minWidth: COL_WIDTHS.name,
        whiteSpace: 'normal',
        overflowWrap: 'break-word',
        textOverflow: 'break-word'
    };

    useEffect(() => {
        if (!firebaseUid) return;
        console.log(`Fetching pieces for buildId: ${buildId} and firebaseUid: ${firebaseUid}`); // FIXME: remove debug log
        api.get(`/sets/${buildId}/pieces`, { params: { firebaseUid } })
            .then((res) => setPieces(res.data));
    }, [buildId, firebaseUid]);

    const handleOwnedChange = (pieceId, value, firebaseUid) => {
        const parsedQty = Math.max(0, parseInt(value, 10) || 0);
        const piece = pieces.find(p => p.piece_id === pieceId);
        const maxQty = piece ? piece.required_qty : Infinity;
        const finalQty = Math.min(parsedQty, maxQty);

        console.log(`Updating piece ${pieceId} owned quantity to ${finalQty}`);
        api.put('/sets/piece', {
            buildId,
            pieceId,
            owned_qty: finalQty,
            firebaseUid: firebaseUid
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
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                    <col style={{ width: COL_WIDTHS.image }} />
                    <col style={{ width: COL_WIDTHS.name }} />
                    <col style={{ width: COL_WIDTHS.color }} />
                    <col style={{ width: COL_WIDTHS.required }} />
                    <col style={{ width: COL_WIDTHS.haveAll }} />
                    <col style={{ width: COL_WIDTHS.owned }} />
                </colgroup>
                <TableHead>
                    <TableRow>
                        <TableCell>Image</TableCell>
                        <TableCell sx={SET_NAME_COL_SX}>Name</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell align="center">Have All</TableCell>
                        <TableCell>Owned</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pieces.map((piece) => (
                        <TableRow key={piece.piece_id}>
                            <TableCell style={{ position: 'relative', overflow: 'visible', width: COL_WIDTHS.image }}>
                                <img src={piece.image_url} alt={piece.name || ''} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                            </TableCell>
                            <TableCell sx={SET_NAME_COL_SX}>{piece.name}</TableCell>
                            <TableCell>{piece.color}</TableCell>
                            <TableCell>{piece.required_qty}</TableCell>
                            <TableCell align="center">
                                <CheckCircleIcon
                                    sx={{
                                        color: (piece.owned_qty || 0) === piece.required_qty ? 'green' : '#BDBDBD',
                                        fontSize: 28
                                    }}
                                    aria-label={(piece.owned_qty || 0) === piece.required_qty ? 'Have all pieces' : 'Missing pieces'}
                                />
                            </TableCell>
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
