import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import PilotApp from './PilotApp.tsx';
import ClientMobileApp from './ClientMobileApp.tsx';
import './index.css';

const target = import.meta.env.VITE_APP_TARGET;

createRoot(document.getElementById('root')!).render(
  target === 'client' ? (
    <ClientMobileApp />
  ) : import.meta.env.VITE_API_MODE === 'server' ? (
    <PilotApp />
  ) : (
    <App />
  )
);
