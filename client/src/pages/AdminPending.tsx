import { useEffect, useState } from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack, Alert } from '@mui/material';
import api from '../api/client';

type PendingUser = {
  _id: string;
  fullName: string;
  email: string;
  createdAt: string;
};

export default function AdminPending() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/users/pending');
      setUsers(res.data.users ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    setError(null);
    try {
      await api.post(`/api/admin/approve/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Approval failed');
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Pending Approvals</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" onClick={() => approve(u._id)}>Approve</Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No pending users</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}


