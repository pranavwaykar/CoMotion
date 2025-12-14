import { PropsWithChildren } from 'react';
import './auth.css';
import { Container, Box } from '@mui/material';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="auth-bg">
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ width: '100%' }}>
          {children}
        </Box>
      </Container>
    </div>
  );
}


