import { useState } from 'react';
import { TextField, Button, Stack, Typography, Alert, Paper } from '@mui/material';
import api from '../api/client';
import { setToken } from '../lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { enqueueSnackbar } from 'notistack';

export default function Register() {
  const schema = z.object({
    fullName: z.string().min(2, 'Enter full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Minimum 8 characters'),
  });
  const { register: r, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/register', values);
      setToken(res.data.token);
      enqueueSnackbar('Registered successfully', { variant: 'success' });
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Registration failed');
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Paper elevation={2} sx={{ p: 4, maxWidth: 520, mx: 'auto' }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Create your account</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Full Name" {...r('fullName')} error={!!errors.fullName} helperText={errors.fullName?.message} />
          <TextField label="Company Email" {...r('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField label="Password" type="password" {...r('password')} error={!!errors.password} helperText={errors.password?.message} />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>Create Account</Button>
          <Typography variant="body2" color="text.secondary">
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </Stack>
      </Paper>
    </form>
  );
}


