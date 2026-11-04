import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import PilotApp from './PilotApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(import.meta.env.VITE_API_MODE === 'demo' ? <App /> : <PilotApp />);
