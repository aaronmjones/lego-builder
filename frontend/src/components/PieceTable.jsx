import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
    Table, TableBody, TableCell, TableHead, TableRow,
    TextField, Typography
} from '@mui/material';

function PieceTable({ setId, setName }) {
    const [pieces, setPieces] = useState([]);

    useEffect(() => {
        api.get(`/sets/${setId}/pieces`).then((res) => setPieces(res.data));
    }, [setId]);

    const handleOwnedChange = (pieceId, value) => {
        const parsedQty = parseInt(value, 10);
        api.put('/sets/piece', {
            setId,
            pieceId,
            owned_qty: parsedQty,
            userId: 1
        }).then(() => {
            setPieces((prev) =>
                prev.map((p) =>
                    p.piece_id === pieceId ? { ...p, owned_qty: parsedQty } : p
                )
            );
        }).catch((err) => {
            console.error('Error updating piece:', err);
        });
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
                                <TextField
                                    type="number"
                                    value={piece.owned_qty || 0}
                                    onChange={(e) =>
                                        handleOwnedChange(piece.piece_id, e.target.value)
                                    }
                                    style={{ width: '60px' }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default PieceTable;
