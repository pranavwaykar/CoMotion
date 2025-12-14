import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OfferRide from './pages/OfferRide';
import RequestRide from './pages/RequestRide';
import AdminDashboard from './pages/AdminDashboard';
import AdminPending from './pages/AdminPending';
import MyRides from './pages/MyRides';
import AdminAudit from './pages/AdminAudit';
import Settings from './pages/Settings';
import { getToken, clearToken } from './lib/auth';
import AuthLayout from './layouts/AuthLayout';
import logoUrl from './assets/route.png';
import { useEffect } from 'react';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppShell() {
  const location = useLocation();
  const isAuth = location.pathname.startsWith('/login') || location.pathname.startsWith('/register');
  useEffect(() => {
    document.title = 'Office Commute';
    const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = logoUrl;
    document.head.appendChild(link);
  }, []);
  return (
    <>
      {!isAuth && (
        <AppBar position="static" elevation={0}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ gap: 1 }}>
              <img src={logoUrl} alt="Office Commute" style={{ height: 24, marginRight: 8 }} />
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>Office Commute</Typography>
              <Button color="inherit" component={Link} to="/">Dashboard</Button>
              <Button color="inherit" component={Link} to="/offer">Offer Ride</Button>
              <Button color="inherit" component={Link} to="/request">Request Ride</Button>
              <Button color="inherit" component={Link} to="/admin">Admin</Button>
              <Button color="inherit" component={Link} to="/admin/pending">Approvals</Button>
              <Button color="inherit" component={Link} to="/admin/audit">Audit</Button>
              <Button color="inherit" component={Link} to="/my-rides">My Rides</Button>
              <Button color="inherit" component={Link} to="/settings">Settings</Button>
              {getToken() ? (
                <Button color="inherit" onClick={() => { clearToken(); window.location.href = '/login'; }}>Logout</Button>
              ) : (
                <Button color="inherit" component={Link} to="/login">Login</Button>
              )}
            </Toolbar>
          </Container>
        </AppBar>
      )}
      <Box sx={{ py: isAuth ? 0 : 4 }}>
        {isAuth ? (
          <AuthLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </AuthLayout>
        ) : (
          <Container maxWidth="lg">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/offer" element={<ProtectedRoute><OfferRide /></ProtectedRoute>} />
              <Route path="/request" element={<ProtectedRoute><RequestRide /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/pending" element={<ProtectedRoute><AdminPending /></ProtectedRoute>} />
              <Route path="/admin/audit" element={<ProtectedRoute><AdminAudit /></ProtectedRoute>} />
              <Route path="/my-rides" element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </Container>
        )}
      </Box>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <AppShell />
    </BrowserRouter>
  );
}

export default App
