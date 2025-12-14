import { useState } from 'react';
import { Stack, Typography, TextField, Button, Alert } from '@mui/material';
import api from '../api/client';

export default function OfferRide() {
  const [period, setPeriod] = useState<'morning' | 'evening'>('morning');
  const [fromLng, setFromLng] = useState<number>(0);
  const [fromLat, setFromLat] = useState<number>(0);
  const [toLng, setToLng] = useState<number>(0);
  const [toLat, setToLat] = useState<number>(0);
  const [seats, setSeats] = useState<number>(2);
  const [startIso, setStartIso] = useState<string>(new Date().toISOString());
  const [endIso, setEndIso] = useState<string>(new Date(Date.now() + 60 * 60 * 1000).toISOString());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setMessage(null);
    setError(null);
    try {
      const res = await api.post('/api/rides/offers', {
        seatsTotal: seats,
        period,
        timeWindowStart: startIso,
        timeWindowEnd: endIso,
        from: { lng: fromLng, lat: fromLat },
        to: { lng: toLng, lat: toLat },
      });
      setMessage(`Offer created: ${res.data.offer._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create offer');
    }
  };

  return (
    <Stack spacing={2} maxWidth={560} margin="0 auto">
      <Typography variant="h6">Offer a Ride</Typography>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={2}>
        <Button variant={period === 'morning' ? 'contained' : 'outlined'} onClick={() => setPeriod('morning')}>Morning</Button>
        <Button variant={period === 'evening' ? 'contained' : 'outlined'} onClick={() => setPeriod('evening')}>Evening</Button>
      </Stack>
      <TextField label="Seats" type="number" value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
      <TextField label="Start ISO" value={startIso} onChange={(e) => setStartIso(e.target.value)} />
      <TextField label="End ISO" value={endIso} onChange={(e) => setEndIso(e.target.value)} />
      <TextField label="From Lng" type="number" value={fromLng} onChange={(e) => setFromLng(Number(e.target.value))} />
      <TextField label="From Lat" type="number" value={fromLat} onChange={(e) => setFromLat(Number(e.target.value))} />
      <TextField label="To Lng" type="number" value={toLng} onChange={(e) => setToLng(Number(e.target.value))} />
      <TextField label="To Lat" type="number" value={toLat} onChange={(e) => setToLat(Number(e.target.value))} />
      <Button variant="contained" onClick={submit}>Create Offer</Button>
    </Stack>
  );
}


