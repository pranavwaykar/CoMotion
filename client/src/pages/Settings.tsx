import { useEffect, useState } from 'react';
import { Paper, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import api from '../api/client';
import { enqueueSnackbar } from 'notistack';
import CommuteMap from '../components/Map/Map';

export default function Settings() {
  const [home, setHome] = useState<{ lng: number; lat: number } | null>(null);
  const [office, setOffice] = useState<{ lng: number; lat: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/settings/places').then((res) => {
      setHome(res.data.home);
      setOffice(res.data.office);
    }).catch((e) => setError(e?.response?.data?.error ?? 'Failed to load places'));
  }, []);

  const save = async () => {
    setError(null);
    try {
      await api.post('/api/settings/places', { home, office });
      enqueueSnackbar('Saved places updated', { variant: 'success' });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to save places');
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Saved Places</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={2}>
        <Typography variant="subtitle1">Home</Typography>
        <Stack direction="row" spacing={2}>
          <TextField label="Lng" type="number" value={home?.lng ?? ''} onChange={(e) => setHome({ lng: Number(e.target.value), lat: home?.lat ?? 0 })} />
          <TextField label="Lat" type="number" value={home?.lat ?? ''} onChange={(e) => setHome({ lng: home?.lng ?? 0, lat: Number(e.target.value) })} />
        </Stack>
        <Typography variant="subtitle1">Office</Typography>
        <Stack direction="row" spacing={2}>
          <TextField label="Lng" type="number" value={office?.lng ?? ''} onChange={(e) => setOffice({ lng: Number(e.target.value), lat: office?.lat ?? 0 })} />
          <TextField label="Lat" type="number" value={office?.lat ?? ''} onChange={(e) => setOffice({ lng: office?.lng ?? 0, lat: Number(e.target.value) })} />
        </Stack>
        <Button variant="contained" onClick={save}>Save</Button>
        <CommuteMap from={home ?? undefined} to={office ?? undefined} />
      </Stack>
    </Paper>
  );
}


