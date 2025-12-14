import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OfferRide from './pages/OfferRide';
import RequestRide from './pages/RequestRide';
import AdminDashboard from './pages/AdminDashboard';
import { getToken, clearToken } from './lib/auth';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <AppBar position="static" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
              Office Commute
            </Typography>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            <Button color="inherit" component={Link} to="/offer">Offer Ride</Button>
            <Button color="inherit" component={Link} to="/request">Request Ride</Button>
            <Button color="inherit" component={Link} to="/admin">Admin</Button>
            {getToken() ? (
              <Button color="inherit" onClick={() => { clearToken(); window.location.href = '/login'; }}>Logout</Button>
            ) : (
              <Button color="inherit" component={Link} to="/login">Login</Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/offer" element={<ProtectedRoute><OfferRide /></ProtectedRoute>} />
            <Route path="/request" element={<ProtectedRoute><RequestRide /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  )
}

export default App
