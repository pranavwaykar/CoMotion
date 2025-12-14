import { useState } from 'react';
import { TextField, Button, Stack, Typography, Alert, Paper } from '@mui/material';
import api from '../api/client';
import { setToken } from '../lib/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Login failed');
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Paper elevation={2} sx={{ p: 4, maxWidth: 480, mx: 'auto' }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Welcome back</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" size="large">Login</Button>
          <Typography variant="body2" color="text.secondary">
            No account? <Link to="/register">Register</Link>
          </Typography>
        </Stack>
      </Paper>
    </form>
  );
}


