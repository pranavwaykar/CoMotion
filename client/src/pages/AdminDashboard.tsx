import { useEffect, useState } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import api from '../api/client';
import KpiBarChart from '../components/Charts/KpiBarChart';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any | null>(null);

  useEffect(() => {
    api.get('/api/admin/metrics/summary').then((res) => setMetrics(res.data)).catch(() => {});
  }, []);

  if (!metrics) return <Typography>Loading metrics...</Typography>;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Adoption & Activity</Typography>
          <KpiBarChart data={[
            { category: 'Users', value: metrics.totalUsers },
            { category: 'Approved', value: metrics.approvedUsers },
            { category: 'Offers', value: metrics.activeOffers },
            { category: 'Requests', value: metrics.activeRequests },
          ]} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>CO₂ Reduction (kg)</Typography>
          <KpiBarChart data={[
            { category: 'CO2 Saved', value: metrics.co2ReductionKg },
          ]} />
        </Paper>
      </Grid>
    </Grid>
  );
}


