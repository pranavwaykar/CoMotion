import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, List, ListItem, ListItemText, Button, Stack, Alert } from '@mui/material';
import api from '../api/client';

type Offer = {
  _id: string;
  status: 'active' | 'closed';
  seatsTotal: number;
  seatsAvailable: number;
  period: 'morning' | 'evening';
  timeWindowStart: string;
  timeWindowEnd: string;
};

type Request = {
  _id: string;
  status: 'pending' | 'matched' | 'cancelled' | 'completed';
  period: 'morning' | 'evening';
  timeWindowStart: string;
  timeWindowEnd: string;
  matchedOfferId?: string;
};

export default function MyRides() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [o, r] = await Promise.all([
        api.get('/api/rides/offers/mine'),
        api.get('/api/rides/requests/mine'),
      ]);
      setOffers(o.data.offers ?? []);
      setRequests(r.data.requests ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to load rides');
    }
  };

  const closeOffer = async (id: string) => {
    try {
      await api.post(`/api/rides/offers/${id}/close`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to close offer');
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      await api.post(`/api/rides/requests/${id}/cancel`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to cancel request');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">My Rides</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>My Offers</Typography>
            <List dense>
              {offers.map((o) => (
                <ListItem
                  key={o._id}
                  secondaryAction={
                    o.status === 'active' ? (
                      <Button size="small" variant="outlined" onClick={() => closeOffer(o._id)}>Close</Button>
                    ) : undefined
                  }
                >
                  <ListItemText
                    primary={`${o.period.toUpperCase()} • ${new Date(o.timeWindowStart).toLocaleTimeString()}–${new Date(o.timeWindowEnd).toLocaleTimeString()}`}
                    secondary={`Status: ${o.status} • Seats: ${o.seatsAvailable}/${o.seatsTotal}`}
                  />
                </ListItem>
              ))}
              {offers.length === 0 && <ListItem><ListItemText primary="No offers yet" /></ListItem>}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>My Requests</Typography>
            <List dense>
              {requests.map((r) => (
                <ListItem
                  key={r._id}
                  secondaryAction={
                    r.status !== 'cancelled' && r.status !== 'completed' ? (
                      <Button size="small" variant="outlined" onClick={() => cancelRequest(r._id)}>Cancel</Button>
                    ) : undefined
                  }
                >
                  <ListItemText
                    primary={`${r.period.toUpperCase()} • ${new Date(r.timeWindowStart).toLocaleTimeString()}–${new Date(r.timeWindowEnd).toLocaleTimeString()}`}
                    secondary={`Status: ${r.status}${r.matchedOfferId ? ` • Matched: ${r.matchedOfferId}` : ''}`}
                  />
                </ListItem>
              ))}
              {requests.length === 0 && <ListItem><ListItemText primary="No requests yet" /></ListItem>}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}


