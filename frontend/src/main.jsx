import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminFlightsPage } from './pages/AdminFlightsPage';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminFlightsPage />
  </StrictMode>,
);
