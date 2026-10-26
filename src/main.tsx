import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/global.css';
import './styles/table.css';
import './styles/conveyor.css';
import './styles/card.css';
import './styles/dialogs.css';
import './styles/mobile.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el contenedor #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
