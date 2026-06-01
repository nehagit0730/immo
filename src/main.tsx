import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupApiMock } from './apiMock.ts';

// Set up the API local interceptor which handles Vercel hosting or server unavailability elegantly
setupApiMock();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
