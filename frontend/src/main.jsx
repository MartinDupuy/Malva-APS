import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PassengerSearchPage } from './pages/PassengerSearchPage';
import './styles.css';
import './components/passenger/passenger-results.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PassengerSearchPage />
  </StrictMode>,
);
