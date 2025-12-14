import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import api from '../api/client';
import KpiBarChart from '../components/Charts/KpiBarChart';
import CommuteMap from '../components/Map/Map';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState<{ lng: number; lat: number } | undefined>();
  const [to, setTo] = useState<{ lng: number; lat: number } | undefined>();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    // Try admin metrics; if not admin it may 403, ignore
    api.get('/api/admin/metrics/summary')
      .then((res) => setMetrics(res.data))
      .catch(() => {});
  }, []);

  const [period, setPeriod] = useState<'morning' | 'evening'>('morning');
  const [timeStart, setTimeStart] = useState<string>(new Date().toISOString());
  const [timeEnd, setTimeEnd] = useState<string>(new Date(Date.now() + 60 * 60 * 1000).toISOString());

  const searchMatches = async () => {
    setError(null);
    setMatches([]);
    try {
      if (!from || !to) {
        setError('Provide from/to coordinates (lng/lat).');
        return;
      }
      const res = await api.post('/api/rides/match', {
        period,
        timeWindowStart: timeStart,
        timeWindowEnd: timeEnd,
        from,
        to,
      });
      setMatches(res.data.matches ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to search matches');
    }
  };

  return (
    <Stack spacing={3}>
      {metrics && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Org Snapshot</Typography>
          <KpiBarChart data={[
            { category: 'Users', value: metrics.totalUsers },
            { category: 'Approved', value: metrics.approvedUsers },
            { category: 'Offers', value: metrics.activeOffers },
            { category: 'Requests', value: metrics.activeRequests },
          ]} />
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Quick Match</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField label="From Lng" fullWidth type="number" onChange={(e) => setFrom({ lng: Number(e.target.value), lat: from?.lat ?? 0 })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="From Lat" fullWidth type="number" onChange={(e) => setFrom({ lng: from?.lng ?? 0, lat: Number(e.target.value) })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="To Lng" fullWidth type="number" onChange={(e) => setTo({ lng: Number(e.target.value), lat: to?.lat ?? 0 })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="To Lat" fullWidth type="number" onChange={(e) => setTo({ lng: to?.lng ?? 0, lat: Number(e.target.value) })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Start ISO" fullWidth value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="End ISO" fullWidth value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Button variant={period === 'morning' ? 'contained' : 'outlined'} onClick={() => setPeriod('morning')}>Morning</Button>
              <Button variant={period === 'evening' ? 'contained' : 'outlined'} onClick={() => setPeriod('evening')}>Evening</Button>
              <Button variant="contained" onClick={searchMatches}>Find Matches</Button>
            </Stack>
          </Grid>
        </Grid>
        <div style={{ marginTop: 16 }}>
          <CommuteMap from={from} to={to} />
        </div>
        {matches.length > 0 && (
          <Stack sx={{ mt: 2 }} spacing={1}>
            <Typography variant="subtitle1">Top Matches</Typography>
            {matches.map((m, i) => (
              <Paper key={i} sx={{ p: 1 }}>
                Score: {m.score.toFixed(2)} | Start km: {m.startDistKm.toFixed(2)} | End km: {m.endDistKm.toFixed(2)}
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}


