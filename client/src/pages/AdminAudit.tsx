import { useEffect, useState } from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Alert } from '@mui/material';
import api from '../api/client';

type Log = {
  _id: string;
  action: string;
  createdAt: string;
  userId?: string;
  metadata?: any;
};

export default function AdminAudit() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/admin/audit?limit=100').then((res) => setLogs(res.data.logs ?? [])).catch((e) => {
      setError(e?.response?.data?.error ?? 'Failed to load audit logs');
    });
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Audit Logs</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Metadata</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l._id}>
                <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell>{l.userId ?? '-'}</TableCell>
                <TableCell><code style={{ fontSize: 11 }}>{l.metadata ? JSON.stringify(l.metadata) : '-'}</code></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}


